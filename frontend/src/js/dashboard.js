import { loadCSS, router } from "./main.js"

export default () => {
	let config_palette = localStorage.getItem("palette");
	loadCSS("src/css/palettes/" + config_palette + ".css");
	loadCSS("src/css/dashboard.css");

	/* Get querystring from URL ( url?var1=something&var2=123 ) */
	const queryString = window.location.search;

	/* If no query string, user must be on the search page */
	if (!queryString) {
		var inputVal = '';

		/* Update the inputval variable on every handleInputChange call */
		const handleInputChange = (e) => {
			inputVal = e.target.value;
			console.log(inputVal);
			submitButton.dataset.link = `/dashboard?username=${inputVal}`;
		};

		/* #app is the div we are constantly updating in index.html */
		let app = document.querySelector('#app');

		/* We create a new div, give it ID #app, give it the same styling as the original #app */
		const new_div = document.createElement('div');
		new_div.setAttribute('id', 'app');
		new_div.className = 'w-100 h-100';
		/* Specify the new HTML we want to show */
		new_div.innerHTML = `
<button data-link="/menu" type="button" class="go-back-button scale-up ml-4" style="z-index: 1">
	<p class="description scale-up cursor-pointer">GO BACK</p>
</button>
<div class="d-flex flex-column align-items-center justify-content-center h-100">
	<div class="important-label" style="font-size: 50px;">USER DASHBOARD</div>
	<div class="p-4" style="width: 500px">
		<form>
			<div class="input-container">
				<input id="searchbox" type="text" placeholder="Search by Intra ID" class="description input-box" />
				<button data-link="/dashboard?username=" id="searchbutton" type="submit"><img src="../src/assets/search.png" style="width: 32px; height: 32px;"></img></button>
			</div>
		</form>
	</div>
</div>`;
		/* Replace the original #app's entire HTML with the new #app */
		app.outerHTML = new_div.outerHTML;

		/* The entire reason we create a new #app is to be able to hook event listener to specified element IDs */
		let ptr_app = document.querySelector('#app');
		/* Text input field ~ like Display Name input box */
		const inputField = ptr_app.querySelector('#searchbox');
		/* Apply button ~ like Save button */
		const submitButton = ptr_app.querySelector('#searchbutton');
		/* Listen for any input change on the #searchbox input field, and call handleInputChange */
		inputField.addEventListener('input', handleInputChange);

		return ;
	}

	const params = {};
	const paramPairs = queryString.slice(1).split('&');
	for (const pair of paramPairs) {
		const [key, val] = pair.split('=');
		params[key] = val;
	}

	/* This is the function that GETs the user details from our Postgres DB through API ( /api/getUser ) */
	const getUser = async () => {
		try {
			const response = await fetch(`https://localhost:8000/api/getUser?username=${params['username']}`, {
				method: 'GET'
			});

			if (response.ok) {
				const data = await response.json();

				/* API returns username: '' when the requested user is not found */
				if (data.username == '') {
					let app = document.querySelector('#app');
					const new_div = document.createElement('div');
					new_div.setAttribute('id', 'app');
					new_div.className = 'w-100 h-100';
					new_div.innerHTML = `
<div class="d-flex position-absolute align-items-center unselectable ml-4" style="height: 8vh; z-index: 1">
	<p data-link="/menu" class="description scale-up cursor-pointer">GO BACK</p>
</div>
<div class="d-flex align-items-center justify-content-center h-100">
	<div class="important-label" style="font-size: 50px;">User ${params['username']} does not exist.</div>
</div>`;
					app.outerHTML = new_div.outerHTML;
					return ;
				}

				/* Force a change of the URL to /dashboard?username=_username_,
					to avoid any page reloads sending a GET to Postgres again,
					due to loading=true present in querystring */
				window.history.replaceState("", "", `/dashboard?username=${params['username']}`);

				/* Get name of the active user */
				const current_user = sessionStorage.getItem('username');

				let versus_history = [0];
				if (data.versus_history.length) {
					versus_history = data.versus_history.join(',');
				}

				var games_played = 0;
				var pong_played = 0;
				var dong_played = 0;
				var matches_won = 0;
				var matches_lost = 0;
				var current_streak = 0;
				var longest_streak = 0;
				var win_rate = 0;

				fetch(`https://localhost:8000/api/getVersus?id=${versus_history}`, {
					method: 'GET'
				}).then(res => {
					if (res.ok) {
						return res.json();
					} else {
						throw new Error('Something went wrong');
					}
				}).then(matches => {
					games_played = matches.length;
					if (!games_played) {
						games_played = 0;
						return ;
					}

					matches.forEach(data => {
						let curr = data.player_1_id == current_user ? 1 : 2;
						let opp = curr == 1 ? 2 : 1;

						console.log('curr', curr);
						console.log('opp', opp);

						console.log('you:', data[`player_${curr}_id`]);
						console.log('opponent:', data[`player_${opp}_id`]);

						console.log('score:', data[`player_${curr}_score`], '-', data[`player_${opp}_score`]);

						let win = (data[`player_${curr}_score`] > data[`player_${opp}_score`]) ? 1 : 0;
						win ? matches_won++ : matches_lost++;
						win ? current_streak++ : current_streak = 0;
						longest_streak = current_streak > longest_streak ? current_streak : longest_streak;

						data.match_type == "pong" ? pong_played++ : dong_played++;

						console.log("streak:", current_streak);
					});

					console.log("games played", games_played);
					console.log("pong played", pong_played);
					console.log("dong played", dong_played);
					console.log("matches won", matches_won);
					console.log("matches lost", matches_lost);
					console.log("longest", longest_streak);

					win_rate = Math.ceil((matches_won / games_played) * 100);
					console.log('win rate', win_rate + '%');
				}).then(() => {
					let app = document.querySelector('#app');
					const new_div = document.createElement('div');
					new_div.setAttribute('id', 'app');
					new_div.className = 'w-100 h-100';
					new_div.innerHTML = `
<div class="d-flex position-absolute align-items-center unselectable ml-4" style="height: 8vh; z-index: 1">
	<p data-link="/menu" class="description scale-up cursor-pointer">GO BACK</p>
</div>
<div class="d-flex flex-row align-items-center justify-content-around h-100" style="padding: 50px 0;">
	<div class="d-flex flex-column justify-content-between rounded-border glowing-border h-100 w-100 mx-3" style="min-width: 400px; max-width:600px;">
		<div class="flex-grow-1" style="overflow-y: auto">
			<div class="px-4 py-2">
				<div class="important-label" style="text-shadow: 0 0 30px var(--color2)">Games Played</div>
				${games_played == 0 ? '<p class="description mt-4">No games played yet.</p>' : 
				`<div class="d-flex align-items-center border w-100 mt-2" style="height: 200px">
					<svg id="graph1" style="width: 100%"></svg>
				</div>`}
			</div>
			<div class="px-4 py-2">
				<div class="important-label" style="text-shadow: 0 0 30px var(--color2)">Wins / Losses</div>
				${games_played == 0 ? '<p class="description mt-4">No games played yet.</p>' : 
				`<div class="d-flex align-items-center border w-100 mt-2" style="height: 200px">
					<svg id="graph2" style="width: 100%"></svg>
				</div>`}
			</div>
		</div>
		<div class="d-flex flex-row align-items-center justify-content-between border-top px-4 py-2">
			<div class="description">${data.username}'s Game History</div>
			<button data-link="/history?username=${data.username}" type="submit" class="description rounded-border scale-up cursor-pointer px-4 py-2 mx-2" style="background-color: var(--color4)">GO</button>
		</div>
	</div>
	<div class="d-flex flex-column align-items-center justify-content-center h-100 w-100" style="min-width: 200px; max-width:250px;">
		<div class="profile-pic" style="position: relative">
			<img src="${"https://localhost:8000/api" + data.profile_pic}" style="z-index: 0; position: absolute" />
			${current_user == data.username ? '<img src="/src/assets/wojak-point.png" style="z-index: 1; opacity: 85%" />' : ''}
		</div>
		<div class="important-label" style="font-size: 40px;">${data.username.toUpperCase()}</div>
		${current_user != data.username ?
		`<div class="mt-4">
			<button id="add-friend-button" type="submit" class="description rounded-border scale-up cursor-pointer px-4 py-2 mx-2 friend">ADD FRIEND</button>
		</div>` : ''}
	</div>
	<div class="d-flex flex-column justify-content-between rounded-border glowing-border h-100 w-100 mx-3" style="min-width: 400px; max-width:600px;">
		<div class="flex-grow-1" style="overflow-y: auto">
			<div class="px-4 py-2">
				<div class="important-label" style="text-shadow: 0 0 25px var(--color3)">Game Statistics</div>
				<div class="d-table description w-100 pt-2 px-4">
					<div class="d-table-row">
						<div class="d-table-cell py-1">Games Played</div>
						<div class="d-table-cell pl-3">${games_played}</div>
					</div>
					<div class="d-table-row">
						<div class="d-table-cell py-1">* Pong</div>
						<div class="d-table-cell pl-3">${pong_played}</div>
					</div>
					<div class="d-table-row">
						<div class="d-table-cell py-1">* Dong</div>
						<div class="d-table-cell pl-3">${dong_played}</div>
					</div>
					<div class="d-table-row">
						<div class="d-table-cell py-1">Games Won</div>
						<div class="d-table-cell pl-3">${matches_won}</div>
					</div>
					<div class="d-table-row">
						<div class="d-table-cell py-1">Games Lost</div>
						<div class="d-table-cell pl-3">${matches_lost}</div>
					</div>
					<div class="d-table-row">
						<div class="d-table-cell py-1">Win Rate</div>
						<div class="d-table-cell pl-3">${win_rate}%</div>
					</div>
					<div class="d-table-row">
						<div class="d-table-cell py-1">Current Streak</div>
						<div class="d-table-cell pl-3">${current_streak}</div>
					</div>
					<div class="d-table-row">
						<div class="d-table-cell py-1">Longest Streak</div>
						<div class="d-table-cell pl-3">${longest_streak}</div>
					</div>
				</div>
			</div>
			<div class="px-4 py-2">
				<div class="d-flex flex-row align-items-center" style="jutify-content: start">
					<div class="important-label" style="text-shadow: 0 0 25px var(--color5)">User Info</div>
					${current_user == data.username ?
					`<div class="description ml-4">
						<input id="toggle-data-visibility" type="checkbox" class="cursor-pointer mr-2" title="Change visibility of your personal data ( email )" ${data.data_is_visible ? 'checked />Shown' : '/>Hidden'}
					</div>` : ''}
				</div>
				<div class="d-table description w-100 pt-2 px-4">
					<div class="d-table-row my-2">
						<div class="d-table-cell py-1">Display Name</div>
						${current_user == data.username ? /* Ternary here used to check if active user is the user being displayed. If yes, show input box */
							`<div class="d-table-cell input-container pl-3"><input id="new-display-name" type="text" placeholder="Edit display name" class="description" value="${data.display_name}" /></div>`
							: `<div class="d-table-cell pl-3">${data.display_name}</div>` }
					</div>
					${current_user == data.username ?
					`<div class="d-table-row ">
						<div class="d-table-cell py-1">Avatar</div>
						<div class="d-table-cell input-container pl-3"><input id="new-avatar" type="file" accept="image/jpeg, image/png, image/jpg" /></div>
					</div>` : `` }
					${(current_user == data.username) && (!data.data_is_visible) ? 
					`<div class="d-table-row">
						<div class="d-table-cell py-1">Email</div>
						<div class="d-table-cell pl-3">${data.email}</div>
					</div>` : ''
					}
				</div>
			</div>
		</div>

		<div class="modal fade" id="confirmation-modal" tabindex="-1" role="dialog" aria-labelledby="confirmation-modal" aria-hidden="true">
			<div class="modal-dialog modal-dialog-centered" role="document">
				<div class="modal-content background-blur rounded-border">
					<div class="modal-header align-items-center important-label">
						<h5 class="modal-title ml-4">Close ${params['username']}'s Account</h5>
						<button type="button" class="close-modal" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<div class="modal-body description">
						<b>This action is irreversible.</b><br/>
						ALL user data will be lost.<br/>
						[ Display name, custom avatar, match history ]<br/><br/>
						Are you sure you want to delete your account?
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-light" data-dismiss="modal">Cancel</button>
						<button id="close-account-button" type="submit" class="btn btn-danger">Confirm</button>
					</div>
				</div>
			</div>
		</div>

		${current_user == data.username ? /* Ternary here used to check if active user is the user being displayed. If yes, show save button */
		`<div class="align-items-center border-top">
			<div class="d-flex flex-row ml-auto px-4 py-2" style="justify-content: end">
				<button data-toggle="modal" data-target="#confirmation-modal" type="button" class="description rounded-border scale-up cursor-pointer px-4 py-2 mx-2 delete">Delete Account</button>
				<button id="update-button" type="submit" class="description rounded-border scale-up cursor-pointer px-4 py-2 mx-2 save">Save</button>
			</div>
		</div>` : ''}
	</div>
</div>`;
					app.outerHTML = new_div.outerHTML;

					const graph1Data = [
						{ label: "Total", value: games_played },
						{ label: "Pong", value: pong_played },
						{ label: "Dong", value: dong_played }
					];
					const graph1Svg = d3.select('#graph1');
					if (graph1Svg.node()) {
						const graph1Width = graph1Svg.node().getBoundingClientRect().width;
						const graph1Height = 30;
						const graph1Padding = 10;
						const maxBarValue = Math.max(...graph1Data.map(d => d.value));
						const totalHeight = graph1Data.length * (graph1Height + graph1Padding); // Total height occupied by all bars and paddings
						const startY = (graph1Svg.node().getBoundingClientRect().height - totalHeight) / 2; // Calculate the starting y-coordinate
						const maxWidth = graph1Width * 0.8; // Maximum width for the bars, say 80% of the SVG width
						graph1Svg.selectAll("g")
							.data(graph1Data)
							.enter()
							.append("g")
							.attr("transform", (d, i) => `translate(0, ${startY + i * (graph1Height + graph1Padding) + (graph1Height / 2)})`)
							.append("rect")
							.attr("x", 0)
							.attr("y", -graph1Height / 2) // Center the bar vertically
							.attr("width", d => (d.value / maxBarValue) * maxWidth)
							.attr("height", graph1Height)
							.attr("fill", "steelblue")
							.append("title") // Append title element for tooltip
							.text(d => `${d.label}: ${d.value}`);
						graph1Svg.selectAll("text")
							.data(graph1Data)
							.enter()
							.append("text")
							.attr("x", d => ((d.value / maxBarValue) * maxWidth) + 5) // Adjusted x-coordinate calculation
							.attr("y", (d, i) => startY + i * (graph1Height + graph1Padding) + graph1Height / 2)
							.text(d => d.label)
							.attr("alignment-baseline", "middle")
							.attr("fill", "white")
							.append("title") // Append title element for tooltip
							.text(d => `${d.label}: ${d.value}`);
					}
					

					const graph2Data = [
						{ label: "Wins", value: matches_won },
						{ label: "Losses", value: matches_lost },
						{ label: "Longest Streak", value: longest_streak }
					];
					const graph2Svg = d3.select('#graph2');
					if (graph2Svg.node()) {
						const graph2Width = graph2Svg.node().getBoundingClientRect().width;
						const graph2Height = 200; // Adjust height as needed
						const lineXScale = d3.scaleBand()
							.domain(graph2Data.map(d => d.label))
							.range([0, graph2Width])
							.padding(0.1);
						const lineYScale = d3.scaleLinear()
							.domain([0, d3.max(graph2Data, d => d.value)])
							.range([graph2Height, 0]);
						const line = d3.line()
							.x(d => lineXScale(d.label) + lineXScale.bandwidth() / 2)
							.y(d => lineYScale(d.value));
						graph2Svg.append("path")
							.datum(graph2Data)
							.attr("fill", "none")
							.attr("stroke", "steelblue")
							.attr("stroke-width", 2)
							.attr("d", line);
						graph2Svg.selectAll("circle")
							.data(graph2Data)
							.enter()
							.append("circle")
							.attr("cx", d => lineXScale(d.label) + lineXScale.bandwidth() / 2)
							.attr("cy", d => lineYScale(d.value))
							.attr("r", 5)
							.attr("fill", "steelblue");
						graph2Svg.selectAll("text")
							.data(graph2Data)
							.enter()
							.append("text")
							.attr("x", d => lineXScale(d.label) + lineXScale.bandwidth() / 2)
							.attr("y", d => lineYScale(d.value) - 10)
							.text(d => d.value)
							.attr("text-anchor", "middle")
							.attr("fill", "white");
					}


					$('#add-friend-button').click(function() {
						console.log(current_user);
						console.log(params['username']);
						$.ajax({
							url: `https://localhost:8000/api/addFriend`,
							type: 'POST',
							contentType: 'application/json',
							data: JSON.stringify({ "username": current_user, "friend_username": params['username'] }),
							success: function(response) {
								alert("friend added");
								window.history.replaceState("", "", "/menu");
								router();
							},
							error: function(jqXHR, textStatus, errorThrown) {
								alert("friend NOT added");
								console.error('Error updating details:', jqXHR.responseJSON);
							}
						});
					});
	
					$('#close-account-button').click(function() {
						$.ajax({
							url: `https://localhost:8000/api/deleteUser?username=${params['username']}`,
							type: 'DELETE',
							success: function(response) {
								$('#confirmation-modal').modal('hide');
								window.history.replaceState("", "", "/");
								router();
	
								sessionStorage.removeItem('display_name');
								sessionStorage.removeItem('profile_pic');
							},
							error: function(jqXHR, textStatus, errorThrown) {
								alert("Failed to delete, keep on living!");
								console.error('Error deleting account:', jqXHR.responseJSON);
							}
						});
					});
	
					$('#update-button').click(function() {
						var newDataVisibility = $('#toggle-data-visibility').is(':checked');
						var newDisplayName = $('#new-display-name').val();
						var newAvatar = $('#new-avatar')[0].files.length > 0 ? $('#new-avatar')[0].files[0] : null;
						var form_data = new FormData();
	
						form_data.append("data_is_visible", newDataVisibility);
						console.log(newDataVisibility)
						form_data.append("display_name", newDisplayName);
						if (newAvatar !== null) {
							if (newAvatar.size / 1024 > 50) {
								alert("Image size too large.");
								return ;
							}
							form_data.append("profile_pic", newAvatar)
						}
	
						if (newDataVisibility == data.data_is_visible && newDisplayName == data.display_name && newAvatar == null)
							return ;
	
						$.ajax({
							url: `https://localhost:8000/api/editUser?username=${params['username']}`,
							type: 'POST',
							contentType: 'multipart/form-data',
							data: form_data,
							contentType: false,
							processData: false,
							success: function(response) {
								alert("Details updated!");
								sessionStorage.setItem('display_name', response.display_name);
								sessionStorage.setItem('profile_pic', 'https://localhost:8000/api' + response.profile_pic);
								window.history.replaceState("", "", `/dashboard?username=${params['username']}`);
								router();
							},
							error: function(jqXHR, textStatus, errorThrown) {
								alert("Failed to update, fucking noob");
								console.error('Error updating details:', jqXHR.responseJSON);
							}
						});
					});
				}).catch(err => {
					console.error('Something went wrong:', err);
				});
			} else {
				console.error(error);
			}
		} catch (error) {
		  console.error('Error sending code:', error);
		}
	};

	getUser();

	let app = document.querySelector('#app');
	const new_div = document.createElement('div');
	new_div.setAttribute('id', 'app');
	new_div.className = 'w-100 h-100';
	new_div.innerHTML = `
<div class="d-flex align-items-center justify-content-center h-100">
<div class="important-label" style="font-size: 50px;">Searching for user ${params['username']} </div>
</div>`;
	app.outerHTML = new_div.outerHTML;

	return ;
}

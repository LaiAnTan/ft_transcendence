import { navigate, loadCSS } from "./main.js";

function game() {
	let config_palette = localStorage.getItem("palette");
	loadCSS("src/css/palettes/" + config_palette + ".css");
	loadCSS("src/css/game.css");
	const urlParams = new URLSearchParams(window.location.search);
	let tournamentID = urlParams.get('tournamentID');

	let player_1_score = 0;
	let player_2_score = 0;
	let player_1_username = " ";
	let player_2_username = " ";
	let is_animating = false;
	let isMatchmaking = true;
	var isRunning = false;
	var socket;
	let id = sessionStorage.getItem('username');
	var roomID;
	var clientID = sessionStorage.getItem('username');

	let isLeftPaddleAnimating = false;
	let isRightPaddleAnimating = false;

	function isJSON(str) {
		try {
			JSON.parse(str);
			return true;
		} catch (e) {
			return false;
		}
	}

	function handlePopState(event) {
		if (window.location.pathname !== "/pong") {
			if (!isMatchmaking) {
				const confirmed = confirm("Are you sure you want to leave the game?");
				if (!confirmed) {
					history.pushState(null, null, "/pong");
				}
			}
			fetch(`https://localhost:8000/api/exitRoom?clientID=${clientID}&gameMode=pong`, {
				method: "DELETE"
			})
			.then(() => {
				window.location.reload();
			})
			.catch(error => {
				console.error('Error exiting room:', error);
			});
			if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
				socket.close();
			}
			window.removeEventListener("popstate", handlePopState);
		}
	}
	window.addEventListener("popstate", handlePopState);
	let app = document.querySelector('#app');
	const new_div = document.createElement('div');
	new_div.setAttribute('id', 'app');
	new_div.className = 'w-100 h-100';
	new_div.innerHTML = `
<div class="w-100 h-100 p-5">
	<div class="d-flex justify-content-center w-80 mx-auto pb-3">
		<div class="d-flex flex-row player-text justify-content-between align-items-end w-100 mr-4">
			<div id="player1name" class="player-username-text-size pb-2">${player_1_username}</div>
			<div id="player1score" class="player-score-text-size p1-colour">${player_1_score.toString()}</div>
		</div>
		<div class="d-flex align-items-center description dash">-</div>
		<div class="d-flex flex-row player-text justify-content-between align-items-end w-100 ml-4">
			<div id="player2score" class="player-score-text-size p2-colour">${player_2_score.toString()}</div>
			<div id="player2name" class="player-username-text-size pb-2">${player_2_username}</div>
		</div>
	</div>
	<div class="game-container mx-auto">
		<div class="game-box w-100">
			<div id="dongball"></div>
			<div id="paddle_left"></div>
			<div id="paddle_right"></div>
		</div>
	</div>
</div>

<button id="matchmaking-trigger" data-toggle="modal" data-target="#matchmaking" type="button" style="display: none;"></button>
<div class="modal fade" id="matchmaking" tabindex="-1" role="dialog" aria-labelledby="matchmaking" aria-hidden="true">
	<div class="modal-dialog modal-dialog-centered" role="document">
		<div class="modal-content" style="background-color: transparent;">
			<div class="modal-body d-flex flex-column align-items-center justify-content-center text-center important-label">
				<b id="countdown-text" style="font-size: 70px">MATCHMAKING...</b>
				<p id="matchmaking-cancel">Press any key to cancel</p>
			</div>
		</div>
	</div>
</div>

<button id="win-splash-trigger" data-toggle="modal" data-target="#win-splash" type="button" style="display: none;"></button>
<button id="lose-splash-trigger" data-toggle="modal" data-target="#lose-splash" type="button" style="display: none;"></button>
<div class="modal fade" id="lose-splash" tabindex="-1" role="dialog" aria-labelledby="lose-splash" aria-hidden="true">
	<div class="modal-dialog modal-dialog-centered" role="document">
		<div class="modal-content" style="background-color: transparent;">
			<div class="modal-body d-flex flex-column align-items-center justify-content-center text-center important-label">
				<b style="font-size: 70px; text-shadow: 0 0 25px red">YOU GOT PONGED</b>
				<p>Click anywhere to continue</p>
			</div>
		</div>
	</div>
</div>
<div class="modal fade" id="win-splash" tabindex="-1" role="dialog" aria-labelledby="win-splash" aria-hidden="true">
	<div class="modal-dialog modal-dialog-centered" role="document">
		<div class="modal-content" style="background-color: transparent;">
			<div class="modal-body d-flex flex-column align-items-center justify-content-center text-center important-label">
				<b style="font-size: 70px; text-shadow: 0 0 25px green">NICE PONG</b>
				<p>Click anywhere to continue</p>
			</div>
		</div>
	</div>
</div>`;
	app.outerHTML = new_div.outerHTML;

	$('#matchmaking-trigger').click();


	if (urlParams.has('tournamentID')) {
		tournamentID = urlParams.get('tournamentID');

		$('#matchmaking-trigger').on('click', function () {
			$('#win-splash').modal('hide');
			$('#lose-splash').modal('hide');
		});

		socket = new WebSocket(`wss://localhost:8001/pong?roomID=${tournamentID}&clientID=${clientID}`);
		socket.onopen = function(event) {
			console.log("WebSocket connection opened");
			console.log("client", clientID, "joined room", tournamentID);
		};
		socket.onmessage = function(event) {
			// console.log( "Received message:", event.data);
			if (isJSON(event.data)) {
				let endElement = document.getElementById("dongball");
				let eventData = JSON.parse(event.data);

				try {
					if (eventData.scores && isRunning == false) {
						isRunning = true;
						isMatchmaking = false;

						setTimeout(function () {
							player_1_score = eventData.scores[0];
							player_2_score = eventData.scores[1];
							document.getElementById('player1score').textContent = player_1_score.toString();
							document.getElementById('player2score').textContent = player_2_score.toString();
							$('#matchmaking').modal('hide');
						}, 500);
					}
				} catch (e) { console.error(e); }

				if (eventData.status == "ALL PLAYERS JOINED") {
					isMatchmaking = false;
					$('#matchmaking-cancel').html(`<b>${eventData.p1}</b>   VS   <b>${eventData.p2}</b>`);
					$('#countdown-text').text("READY");
					setTimeout(function() {
						$('#countdown-text').text("2");
					}, 750);
					setTimeout(function() {
						$('#countdown-text').text("1");
					}, 1500);
					setTimeout(function() {
						$('#matchmaking').modal('hide');
					}, 2150);
				}
				if (eventData.room_id && eventData.player_1_id && eventData.player_2_id && eventData.match_type) {
					if (eventData.player_1_score !== eventData.player_2_score) {
						const isClientWinner = (eventData.player_1_score > eventData.player_2_score && eventData.player_1_id === clientID) ||
											   (eventData.player_2_score > eventData.player_1_score && eventData.player_2_id === clientID);
						if (isClientWinner) {
							fetch ('https://localhost:8000/api/tournamentScore', {
								method: "POST",
								headers: {
									"Content-Type": "application/json"
								},
								body: JSON.stringify(eventData)
							})
							.then(response => response.json())
							.catch(error => {
								console.error('Error adding tournament game:', error);
							});
							$('#win-splash-trigger').click();
						} else {
							fetch(`https://localhost:8000/api/tournamentLoser?loserID=${clientID}`, {
								method: "DELETE" })
							.then(response => response.json())
							.catch(error => {
								console.error('Error marking tournament loser:', error);
							});
							$('#lose-splash-trigger').click();
						}
						fetch(`https://localhost:8000/api/closeRoom?room_code=${eventData.room_id}&gameMode=pong`, {
							method: "DELETE"
						})
						.then(response => response.json())
						.catch(error => {
							console.error('Error closing room:', error);
						});
						if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
							socket.close();
						}
						// navigate("/vs-player");
						navigate("/tournament");
						window.removeEventListener("popstate", handlePopState);
					}
				}
				if (eventData.console != undefined) {
					console.log(eventData.console);
				}
				if (endElement !== null) {
					if (eventData.players && eventData.players.length > 0) {
						document.getElementById('player1name').textContent = eventData.players[0].toString();
						document.getElementById('player2name').textContent = eventData.players[1].toString();
					}
					if (eventData.sound == 1){
						playWallSound();
					}
					tweenBallPosition(endElement, eventData.ball_x, eventData.ball_y, 1);
					tweenPaddlePosition(document.getElementById('paddle_left'), eventData.paddle_left_y, 2);
					tweenPaddlePosition(document.getElementById('paddle_right'), eventData.paddle_right_y, 2);
					if (eventData.hit != undefined) {
						// if (eventData.hit == "HIT WALL") {
						//     playWallSound();
						// }
						if (eventData.hit == "HIT LEFT") {
							player_2_score += 1;
							document.getElementById('player2score').textContent = player_2_score.toString();
						}
						if (eventData.hit == "HIT RIGHT") {
							player_1_score += 1;
							document.getElementById('player1score').textContent = player_1_score.toString();
						}
					}
					return ;
				} 
				else {
					console.error("Element with id 'end' not found.");
				}
			}
		};
		socket.onclose = function(event) {
			console.log("WebSocket connection closed");
		};
		socket.onerror = function(event) {
			console.error("WebSocket error:", event);
			console.error("WebSocket connection closed due to room already have 2 players or room not found");
		};
	} else {
		fetch("https://localhost:8000/api/matchmaking?clientID=" + clientID  + "&gameMode=pong", {
			method: "GET"
		})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				throw new Error(data.error);
			}
			roomID = data.roomID;
			socket = new WebSocket(`wss://localhost:8001/pong?roomID=${roomID}&clientID=${clientID}`);
			socket.onopen = function(event) {
				console.log("WebSocket connection opened");
				console.log("client", clientID, "joined room", roomID);
			};
			socket.onmessage = function(event) {
				if (isJSON(event.data)) {
					let endElement = document.getElementById("dongball");
					let eventData = JSON.parse(event.data);

					try {
						if (eventData.scores && isRunning == false) {
							isRunning = true;
							isMatchmaking = false;
	
							setTimeout(function () {
								player_1_score = eventData.scores[0];
								player_2_score = eventData.scores[1];
								document.getElementById('player1score').textContent = player_1_score.toString();
								document.getElementById('player2score').textContent = player_2_score.toString();
								$('#matchmaking').modal('hide');
							}, 500);
						}
					} catch (e) { console.error(e); }

					if (eventData.status === "ALL PLAYERS JOINED") {
						isMatchmaking = false;
						$('#matchmaking-cancel').html(`<b>${eventData.p1}</b>   VS   <b>${eventData.p2}</b>`);
						$('#countdown-text').text("READY");
						setTimeout(function() {
							$('#countdown-text').text("2");
						}, 750);
						setTimeout(function() {
							$('#countdown-text').text("1");
						}, 1500);
						setTimeout(function() {
							$('#matchmaking').modal('hide');
						}, 2150);
					}
					if (eventData.room_id && eventData.player_1_id && eventData.player_2_id && eventData.match_type) {
						if (eventData.player_1_score !== eventData.player_2_score) {
							const isClientWinner = (eventData.player_1_score > eventData.player_2_score && eventData.player_1_id === clientID) ||
												   (eventData.player_2_score > eventData.player_1_score && eventData.player_2_id === clientID);
	
							if (isClientWinner) {
								fetch('https://localhost:8000/api/addVersus', {
									method: "POST",
									headers: {
										"Content-Type": "application/json"
									},
									body: JSON.stringify(eventData)
								})
								.then(response => response.json())
								.catch(error => {
									console.error('Error adding versus game or closing room:', error);
								});
								$('#win-splash-trigger').click();
							} else {
								$('#lose-splash-trigger').click();
							}
							fetch(`https://localhost:8000/api/closeRoom?room_code=${eventData.room_id}&gameMode=pong`, {
								method: "DELETE"
							})
							.then(response => response.json())
							.catch(error => {
								console.error('Error closing room:', error);
							});
							if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
								socket.close();
							}
							navigate("/vs-player");
							window.removeEventListener("popstate", handlePopState);
						}
					}
					if (eventData.console != undefined) {
						console.log(eventData.console);
					}
					if (endElement !== null) {
						if (eventData.players && eventData.players.length > 0) {
							document.getElementById('player1name').textContent = eventData.players[0].toString().toUpperCase();
							document.getElementById('player2name').textContent = eventData.players[1].toString().toUpperCase();
						}
						if (eventData.sound == 1){
							playWallSound();
						}
						tweenBallPosition(endElement, eventData.ball_x, eventData.ball_y, 1);
						tweenPaddlePosition(document.getElementById('paddle_left'), eventData.paddle_left_y, 2);
						tweenPaddlePosition(document.getElementById('paddle_right'), eventData.paddle_right_y, 2);
						if (eventData.hit != undefined) {
							// if (eventData.hit == "HIT WALL") {
							// 	playWallSound();
							// }
							if (eventData.hit == "HIT LEFT") {
								player_2_score += 1;
								document.getElementById('player2score').textContent = player_2_score.toString();
							}
							if (eventData.hit == "HIT RIGHT") {
								player_1_score += 1;
								document.getElementById('player1score').textContent = player_1_score.toString();
							}
						}
						return ;
					} 
					else {
						console.error("Element with id 'end' not found.");
					}
				}
			};
			socket.onclose = function(event) {
				console.log("WebSocket connection closed");
			};
			socket.onerror = function(event) {
				console.error("WebSocket error:", event);
				console.error("WebSocket connection closed due to room already have 2 players or room not found");
			};
		})
		.catch(error => {
			console.error("Error: ", error);
		});
	}

	function tweenPaddlePosition(element, targetY, duration) {
		if (!element) {
			return;
		}

		let isAnimating = element.classList.contains('paddle-left') ? isLeftPaddleAnimating : isRightPaddleAnimating;
		
		if (isAnimating) {
			return; // Don't start a new animation if one is already in progress
		  }
		  
		  isAnimating = true;
		  
		const start = { y: parseFloat(element.style.top) || 0 };
		const change = { y: targetY - start.y };
		const startTime = performance.now();
		
		function updateTween() {
			const elapsed = performance.now() - startTime;
			const progress = Math.min(1, elapsed / duration);
		
			const newY = start.y + change.y * progress;
		
			element.style.top = newY + "%";
		
			if (progress < 1) {
				requestAnimationFrame(updateTween);
			} else {
				isAnimating = false; // Animation completed, reset the flag
				if (element.classList.contains('paddle-left')) {
					isLeftPaddleAnimating = false;
				} else {
					isRightPaddleAnimating = false;
				}
			}
		}
		
		requestAnimationFrame(updateTween);
	}

	function tweenBallPosition(element, targetX, targetY, duration) {
		
		if (is_animating) {
			return; // Don't start a new animation if one is already in progress
		}

		is_animating = true;

		const start = { x: parseFloat(element.style.left) || 0, y: parseFloat(element.style.top) || 0 };
		const change = { x: targetX - start.x, y: targetY - start.y };
		const startTime = performance.now();

		function updateTween() {
			const elapsed = performance.now() - startTime;
			const progress = Math.min(1, elapsed / duration);

			const newX = start.x + change.x * progress;
			const newY = start.y + change.y * progress;

			element.style.left = newX + "%";
			element.style.top = newY + "%";

			if (progress < 1) {
				requestAnimationFrame(updateTween);
			} else {
			is_animating = false; // Animation completed, reset the flag
			}
		}
		requestAnimationFrame(updateTween);
	}

	function playWallSound() {
		// console.log("SOUNDDDD");
		let beat = new Audio('../src/assets/osu-hit-sound.mp3');
		beat.play();
		// x.play();
	}

	const pressedKeys = new Set();

	document.addEventListener("keydown", (event) => {
		if (isMatchmaking) {
			history.back();
		}

		if (event.key === 'w' || event.key === 's') {
			pressedKeys.add(event.key);
	
			// Determine the direction based on pressed keys
			let direction;
			if (pressedKeys.has('w') && pressedKeys.has('s')) {
				// If both keys are pressed, cancel out the movement
				direction = "PADDLE_STOP";
			} else if (pressedKeys.has('w')) {
				direction = "PADDLE_UP";
			} else if (pressedKeys.has('s')) {
				direction = "PADDLE_DOWN";
			}
	
			if (direction) {
				const message = {
					id: id,
					direction: direction
				};
	
				// Send the WebSocket message
				if (socket.readyState === WebSocket.OPEN) {
					socket.send(JSON.stringify(message));
				}
			}
		}

		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			pressedKeys.add(event.key);
	
			// Determine the direction based on pressed keys
			let direction;
			if (pressedKeys.has('ArrowUp') && pressedKeys.has('ArrowDown')) {
				// If both keys are pressed, cancel out the movement
				direction = "PADDLE_STOP";
			} else if (pressedKeys.has('ArrowUp')) {
				direction = "PADDLE_UP";
			} else if (pressedKeys.has('ArrowDown')) {
				direction = "PADDLE_DOWN";
			}
	
			if (direction) {
				const message = {
					id: "2",
					direction: direction
				};
	
				// Send the WebSocket message
				if (socket.readyState === WebSocket.OPEN) {
					socket.send(JSON.stringify(message));
				}
			}
		}
	});
	
	// Keyup event listener
	document.addEventListener("keyup", (event) => {
		if (event.key === 'w' || event.key === 's') {
			pressedKeys.delete(event.key);
	
			// Determine the direction based on remaining pressed keys
			let direction;
			if (pressedKeys.has('w')) {
				direction = "PADDLE_UP";
			} else if (pressedKeys.has('s')) {
				direction = "PADDLE_DOWN";
			} else {
				direction = "PADDLE_STOP";
			}
	
			const message = {
				id: id,
				direction: direction
			};
	
			// Send the WebSocket message
			if (socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify(message));
			}
		}

		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			pressedKeys.delete(event.key);
		
			// Determine the direction based on remaining pressed keys
			let direction;
			if (pressedKeys.has('ArrowUp')) {
				direction = "PADDLE_UP";
			} else if (pressedKeys.has('ArrowDown')) {
				direction = "PADDLE_DOWN";
			} else {
				direction = "PADDLE_STOP";
			}

			const message = {
				id: "2",
				direction: direction
			};
	
			// Send the WebSocket message
			if (socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify(message));
			}
		}
	});

	return ;
}

export default game;
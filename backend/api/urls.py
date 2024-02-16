from django.urls import path
from .views import views_User, views_Matchup, views_Versus, views_Tournament, authentication

urlpatterns = [
    path('addUser/', views_User.addUser),
    path('getUser/', views_User.getUser),
    path('allUsers/', views_User.getAllUsers),
    path('addMatchup/', views_Matchup.addMatchup),
    path('getMatchup/', views_Matchup.getMatchup),
    path('allMatchups/', views_Matchup.getAllMatchups),
    path('addVersus/', views_Versus.addVersus),
    path('getVersus/', views_Versus.getVersus),
    path('allVersus/', views_Versus.getAllVersus),
    path('addTournament/', views_Tournament.addTournament),
    path('getTournament/', views_Tournament.getTournament),
    path('allTournaments/', views_Tournament.getAllTournament),
    path('authConfig/', authentication.get_auth_config),
	path('postCode/', authentication.postCode),
]
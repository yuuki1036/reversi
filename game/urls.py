from django.urls import path
from . import views

app_name = 'game'

urlpatterns = [
    path('', views.Index.as_view(), name='index'),
    path('home/', views.home, name='home'),
    path('result_list/', views.ResultList.as_view(), name="result_list"),
    path('ranking/', views.Ranking.as_view(), name='ranking'),
    path('play/', views.play, name='play'),
    path('play/posts/', views.culc, name='posts'),
    path('play/result/', views.result, name='result'),

]

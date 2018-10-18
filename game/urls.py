from django.urls import path
from . import views

app_name = 'game'

urlpatterns = [
    path('', views.Index.as_view(), name='index'),
    # path('home/', views.home, name='home'),
]

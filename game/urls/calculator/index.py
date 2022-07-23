from django.urls import path
from game.views.calculator.login import signin
from game.views.calculator.logout import signout
from game.views.calculator.register import register


urlpatterns = [
    path("login/", signin, name="calculator_login"),
    path("logout/", signout, name="calculator_logout"),
    path("register/", register, name="calculator_register"),
]


from django.http import HttpResponse

def index(request):
    line1 = '<h1 style="text-align: center">My First Website！！！！</h1>'
    line2 = '''<img src='https://cdn.acwing.com/media/user/profile/photo/59888_lg_c9ee13c030.jpg' width='800'>'''
    return HttpResponse(line1 + line2)

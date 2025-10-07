from django.urls import path
from . import views
urlpatterns = [
    path('' , views.home , name="home"),
    path('chat/', views.chat , name='chat'),
    path('logout/' , views.user_logout , name="logout"),
    path('login/' , views.user_login , name="login"),
    #connection
    path('connect/' , views.connection , name="connect"),
    # send message from user to admin
    path('send-message/' , views.user_message , name ="sendMessage"),
    # get message from admin to user
    path('admin-message/', views.admin_message , name="admin-message"),
    # get all messages -> sent by user for admin and sent by admin for user
    path('all-messages/' , views.all_messages , name = "all-messages"),
    # online admin finder
    path('online-admin/' , views.online_admin , name ="online-admin"),
    # online status changer
    path('online-status-changer/' ,views.online_status_changer , name = "online-status-changer"),
    # admin connection remover
    path('admin-connection-remover/' , views.admin_connection_remover , name ="admin-connection-remover"),
    # admin connections
    path('admin-connections/' , views.admin_connections , name = 'admin-connections'),
    # send admin message to user
    path('send-admin-message/' , views.send_admin_message , name = "send-admin-message"),
    # get user message to admin
    path('get-user-message/' ,views.get_user_message , name = 'get-user-message'),
    # get all messages -> admin to user and user to admin
    path('get-all-messages/' , views.get_all_messages , name = 'get-all-messages'),
    # new message check
    path('new-message/' ,views.new_message , name = 'new-message'),
]
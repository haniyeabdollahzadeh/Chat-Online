from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.conf import settings
from django.shortcuts import render,redirect
from django.contrib.auth import authenticate , login , logout
from .forms import *
from django.http import HttpResponse
import json
from django.http import JsonResponse
from .models import *
import random as rand
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def home(request):
    return render (request , 'home.html')


def chat(request):
    connection = Connection.objects.filter(admin=request.user.name)
    return render(request , 'admin-chat.html' , {'connection':connection})

def user_logout(request):
    logout(request)
    return redirect('home')


def user_login(request):
    if request.method == 'POST':
        form = UserLoginForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            user = authenticate(request , username  = data['username'] , password = data['password'])

            if user is not None:
                login(request , user)
                return redirect('chat')
            else:
                return HttpResponse(" کاربر موجود نیست")
# connection
def connection(request):
   data =  json.loads(request.body)
   #data = {'userEamil':email  , 'userNumber':number}
   connection = Connection.objects.filter(
                                        userEmail=data['userEmail'] , 
                                        userNumber=data['userNumber']).exists()

   #online admin
   admin = User.objects.filter(is_staff = True , online = True)
   if(len(admin) >= 2):
        admin = admin[rand.randint(0 , len(admin)-1)]
   elif(len(admin) < 2 and len(admin) >= 1):
        admin = admin[0]
   else:
        admin = 'offline'


    #connection
   if connection and admin !='offline':
        Connection.objects.filter(userEmail=data['userEmail'] , userNumber = data['userNumber']).delete()
        Connection.objects.create(userEmail = data['userEmail'] , userNumber = data['userNumber'] , admin = admin.name)
        return JsonResponse({'connection':'isThere' , 'admin':str(admin.name)} , safe = True)
   elif connection == False and admin !='offline':
        Connection.objects.create(userEmail = data['userEmail'] , userNumber = data['userNumber'] , admin = admin.name)
        return JsonResponse({'connection':'connect' , 'admin':str(admin.name)} , safe = True)
   elif connection and admin =='offline':
        Connection.objects.filter(userEmail = data['userEmail'] , userNumber = data['userNumber']).delete()
        Connection.objects.create(userEmail = data['userEmail'] , userNumber = data['userNumber'] , admin = admin)
        return JsonResponse({'connection':'isThere' , 'admin':str(admin)} , safe = True)
   elif connection == False and admin =='offline':
        Connection.objects.create(userEmail = data['userEmail'] , userNumber = data['userNumber'] , admin = admin)
        return JsonResponse({'connection':'connect' , 'admin':str(admin)} , safe = True)



# send user message view
# def user_message(request):
#     data = json.loads(request.body)
#     new_chat_message = Messages.objects.create(text = data['msg'],
#                                                 msg_sender = data['msg_sender'],
#                                                 msg_sender_number = data['msg_sender_number'],
#                                                 msg_receiver = data['msg_receiver'])
#     return JsonResponse({'msgText':new_chat_message.text ,
#                         'msgSender':new_chat_message.msg_sender,
#                         'msgReceiver':new_chat_message.msg_receiver,
#                         'dateTimeStatus':new_chat_message.created.time()} ,safe=True)
def user_message(request):
    data = json.loads(request.body)
    new_chat_message = Messages.objects.create(
        text=data['msg'],
        msg_sender=data['msg_sender'],
        msg_sender_number=data['msg_sender_number'],
        msg_receiver=data['msg_receiver']
    )

    # notify admins via channels
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'admin_chat_room',
        {
            'type': 'chat_message',
            'message': new_chat_message.text,
            'sender_email': data['msg_sender'],
            'sender_number': data['msg_sender_number'],
            'sender_name': data.get('msg_sender_name', data['msg_sender']),
            'time': new_chat_message.created.strftime("%H:%M:%S"),
        }
    )

    return JsonResponse({
    'msgText': new_chat_message.text,
    'msgSender': new_chat_message.msg_sender,
    'msgReceiver': new_chat_message.msg_receiver,
    'dateTimeStatus': new_chat_message.created.time()
    }, safe=True)


# get message from admin to user
def admin_message(request):
    data = json.loads(request.body)
    list = []
    chats = Messages.objects.filter(msg_sender = data['msg_sender'] ,
                                     msg_receiver = data['msg_receiver'] , 
                                     msg_receiver_number = data['msg_receiver_number'] , 
                                     received = False)
    for chat in chats:
        list.append({'msgText':chat.text , 
                     'msgSender':chat.msg_sender , 
                     'msgReceiever':chat.msg_receiver , 
                     'msgReceiverNumber':chat.msg_receiver_number , 
                     'received':chat.received , 
                     'dateTimeText':chat.created.time()})
        Messages.objects.filter(msg_sender = data['msg_sender'] , 
                                msg_receiver = data['msg_receiver'] , 
                                msg_receiver_number = data['msg_receiver_number']).update(received = True)
    return JsonResponse(list, safe = False)

# get all messages sent by user to admin and sent by admin to user
def all_messages(request):
    data = json.loads(request.body)
    list = []
    messages = Messages.objects.all()
    for msg in messages:
        if(msg.msg_sender == data['msg_sender'] and msg.msg_sender_number == data['msg_sender_number'] and msg.msg_receiver == data['msg_sender_admin']):
            list.append({'msgText':msg.text ,
                                  'msgSender':msg.msg_sender,
                                  'msg_receiver':msg.msg_receiver,
                                  'sent_for':msg.msg_sender,
                                  'dateTimeStatus':msg.created.time()})
        elif(msg.msg_sender == data['msg_sender_admin'] and msg.msg_receiver == data['msg_sender'] and msg.msg_receiver_number == data['msg_sender_number']):
            list.append({'msgText':msg.text,
                                'msgSender':msg.msg_sender,
                                'msgReceiver':msg.msg_receiver,
                                'received_from':msg.msg_sender,
                                'dateTimeStatus':msg.created.time()})
    return JsonResponse(list , safe=False)

def online_admin(request):
    data = json.loads(request.body)
    connection = Connection.objects.get(userEmail = data['userEmail'] , userNumber = data['userNumber'])

   #online admin
    admin = User.objects.filter(is_staff = True , online = True)
    if admin.exists():
        if(len(admin) >= 2):
            admin = admin[rand.randint(0 , len(admin)-1)]
        elif(len(admin) < 2 and len(admin) >= 1):
            admin = admin[0]
        else:
            admin = 'offline'

    if(connection.admin =='offline' and admin != 'offline'):
        Connection.objects.filter(userEmail = data['userEmail'] , userNumber = data['userNumber']).update(admin = admin.name)
        Messages.objects.filter(msg_sender = data['userEmail'] , msg_sender_number = data['userNumber'] ,msg_receiver = 'offline').update(msg_receiver = admin.name)
    return JsonResponse({'admin':connection.admin} , safe=False)

# online status changer
def online_status_changer(request):
    username = request.user
    user = User.objects.get(username = username)
    if user.online:
        User.objects.filter(username = username).update(online = False)
    else:
        User.objects.filter(username = username).update(online = True)
    return JsonResponse({"onlineStatusChange":'changed'} , safe =False)


#  admin connection remover
def admin_connection_remover(request):
    Connection.objects.filter(admin = request.user.name).delete()
    Messages.objects.filter(msg_sender = request.user.name).delete()
    Messages.objects.filter(msg_receiver = request.user.name).delete()
    return JsonResponse({'connection and messages':'removed'})

# admin connections
@login_required
def admin_connections(request):
    connection = Connection.objects.filter(admin = request.user.name , received = False)
    list = []
    for connect in connection:
        list.append({'userEmail':connect.userEmail , 'userNumber':connect.userNumber , 'admin':connect.admin})
    Connection.objects.filter(admin = request.user.name , received = False).update(received = True)
    return JsonResponse(list , safe = False)

# send admin message to user
def send_admin_message(request):
    data = json.loads(request.body)
    admin = request.user
    new_chat_message = Messages.objects.create(text = data['msg'],
                                                msg_sender = admin.name,
                                                msg_receiver = data['msg_receiver'],
                                                msg_receiver_number = data['msg_receiver_number'])
    return JsonResponse({'msgText':new_chat_message.text ,
                            'msgSender':new_chat_message.msg_sender,
                            'msgReceiver':new_chat_message.msg_receiver,
                            'msgReceiverNumber':new_chat_message.msg_receiver_number,
                            'dateTimeStatus':new_chat_message.created.time()} ,safe=True)

# get message from user to admin
def get_user_message(request):
    data = json.loads(request.body)
    admin = request.user
    list = []
    messages = Messages.objects.filter(msg_sender = data['msg_sender'] , 
                                       msg_sender_number = data['msg_sender_number'], 
                                       msg_receiver = admin.name, 
                                       received = False)
    for msg in messages:
        list.append({'msgText':msg.text , 
                     'msgSender':msg.msg_sender , 
                     'msgReciever':msg.msg_receiver , 
                     'dateTimeText':msg.created.time()})
        Messages.objects.filter(msg_sender = data['msg_sender'] , 
                                msg_sender_number = data['msg_sender_number'], 
                                msg_receiver = admin.name).update(received = True)
    return JsonResponse(list , safe = False)


# get all messages -> admin to user and user to admin
def get_all_messages(request):
    data = json.loads(request.body)
    user = request.user
    list = []
    messages = Messages.objects.all()
    for msg in messages:
        if(msg.msg_sender == data['msg_sender'] and msg.msg_sender_number == data['msg_sender_number'] and msg.msg_receiver == user.name and msg.received == True):
            list.append({'msgText':msg.text ,
                                  'msgSender':msg.msg_sender,
                                  'msg_receiver':msg.msg_receiver,
                                  'sent_by_user':msg.msg_sender,
                                  'dateTimeStatus':msg.created.time()})
        elif(msg.msg_sender == user.name and msg.msg_receiver == data['msg_sender'] and msg.msg_receiver_number == data['msg_sender_number'] and msg.received == True):
            list.append({'msgText':msg.text,
                                'msgSender':msg.msg_sender,
                                'msgReceiver':msg.msg_receiver,
                                'sent_by_admin':msg.msg_sender,
                                'dateTimeStatus':msg.created.time()})
    return JsonResponse(list , safe=False)

# new message check
def new_message(request):
    data = json.loads(request.body)
    admin = request.user
    messages = Messages.objects.filter(msg_sender = data['msg_sender'] , 
                                       msg_sender_number = data['msg_sender_number'], 
                                       msg_receiver = admin.name  , received = False)
    if(len(messages) > 0):
        return JsonResponse({'message':'true'} , safe = False)
    else:
        return JsonResponse({'message':'false'} , safe = False)



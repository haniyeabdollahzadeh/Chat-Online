from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    name = models.CharField(max_length=100, null=True, blank=True)
    online = models.BooleanField(default=False)
    

class Connection(models.Model):
    userEmail = models.CharField(max_length=100, null=True, blank=True)
    userNumber = models.CharField(max_length=50, null=True, blank=True)
    admin = models.CharField(max_length=100, null=True, blank=True)
    received = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.userEmail} connected to {self.admin}"
    

class Messages(models.Model):
    text = models.TextField()
    msg_sender = models.CharField(max_length=50, null=True, blank=True)
    msg_sender_number = models.CharField(max_length=50, null=True, blank=True)
    msg_receiver = models.CharField(max_length=50, null=True, blank=True)
    msg_receiver_number = models.CharField(max_length=50, null=True, blank=True)
    received = models.BooleanField(default=False)
    created = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'from {self.msg_sender} to {self.msg_receiver}'
    

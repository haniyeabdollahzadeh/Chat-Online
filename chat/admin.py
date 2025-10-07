from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from . models import User, Messages, Connection

UserAdmin.fieldsets += (('extra fields', {'fields': ('name', 'online')}),)

admin.site.register(User, UserAdmin)
admin.site.register([Messages, Connection])


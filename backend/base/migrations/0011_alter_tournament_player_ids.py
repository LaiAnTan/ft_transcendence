# Generated by Django 4.2.9 on 2024-03-22 21:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0010_user_is_online'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tournament',
            name='player_ids',
            field=models.CharField(max_length=20),
        ),
    ]

# Generated by Django 4.2.9 on 2024-03-20 17:16

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0007_alter_versus_game_mode'),
    ]

    operations = [
        migrations.RenameField(
            model_name='versus',
            old_name='game_mode',
            new_name='match_type',
        ),
    ]

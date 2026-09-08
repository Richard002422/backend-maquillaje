from django.contrib import admin

from .models import TryOnResult, VirtualTryOnSession


class TryOnResultInline(admin.TabularInline):
    model = TryOnResult
    extra = 0
    readonly_fields = ("product", "applied_at", "duration_ms", "avg_landmark_confidence")
    can_delete = False


@admin.register(VirtualTryOnSession)
class VirtualTryOnSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "user_id", "status", "started_at", "ended_at")
    list_filter = ("status",)
    search_fields = ("id", "user_id")
    readonly_fields = ("id", "started_at")
    inlines = [TryOnResultInline]

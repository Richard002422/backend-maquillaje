from rest_framework import serializers

from .models import TryOnResult, VirtualTryOnSession


class VirtualTryOnSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VirtualTryOnSession
        fields = ["id", "started_at", "ended_at", "device_info", "status"]
        read_only_fields = ["id", "started_at", "ended_at", "status"]


class TryOnResultCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TryOnResult
        fields = ["id", "product", "applied_at", "duration_ms", "avg_landmark_confidence"]
        read_only_fields = ["id", "applied_at"]

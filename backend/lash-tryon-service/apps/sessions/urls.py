from django.urls import path

from .views import TryOnResultCreateView, VirtualTryOnSessionCloseView, VirtualTryOnSessionCreateView

urlpatterns = [
    path("sessions/", VirtualTryOnSessionCreateView.as_view(), name="session-create"),
    path("sessions/<uuid:pk>/close/", VirtualTryOnSessionCloseView.as_view(), name="session-close"),
    path("sessions/<uuid:session_id>/results/", TryOnResultCreateView.as_view(), name="session-result-create"),
]


from django.urls import include, path
from rest_framework.routers import DefaultRouter
from sanggahan.views import csrf_token_view

from .views import SanggahanViewSet

router = DefaultRouter()
router.register(
    r"sanggahan",
    SanggahanViewSet,
    basename="sanggahan",
)

urlpatterns = [
    path("", include(router.urls)),
]

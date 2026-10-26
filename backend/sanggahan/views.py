from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .models import Sanggahan
from .serializers import SanggahanSerializer


def halaman_sanggahan(request):
    return render(request, "sanggahan.html")


@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({"csrfToken": get_token(request)})


class SanggahanViewSet(viewsets.ModelViewSet):
    queryset = Sanggahan.objects.all().prefetch_related("bukti")
    serializer_class = SanggahanSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # tanpa login, sekaligus tanpa cek CSRF
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        if self.get_object().status != "pending":
            raise PermissionDenied("Sanggahan yang sudah ditinjau tidak dapat diubah.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.status != "pending":
            raise PermissionDenied("Sanggahan yang sudah ditinjau tidak dapat dihapus.")
        instance.delete()

from rest_framework import serializers
from .models import Sanggahan, BuktiSanggahan


class BuktiSanggahanSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuktiSanggahan
        fields = ["id", "file", "nama_asli", "created_at"]
        read_only_fields = fields


class SanggahanSerializer(serializers.ModelSerializer):
    evidence = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
    )
    bukti = BuktiSanggahanSerializer(many=True, read_only=True)

    class Meta:
        model = Sanggahan
        fields = [
            "id",
            "report_id",
            "store_name",
            "reason",
            "story",
            "evidence",
            "bukti",
            "status",
            "admin_response",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "bukti",
            "status",
            "admin_response",
            "created_at",
            "updated_at",
        ]

    def validate_story(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError(
                "Kronologi minimal 20 karakter."
            )

        if len(value.split()) > 500:
            raise serializers.ValidationError(
                "Kronologi maksimal 500 kata."
            )

        return value.strip()

    def validate_evidence(self, files):
        if len(files) > 3:
            raise serializers.ValidationError(
                "Maksimal 3 file bukti."
            )

        for file in files:
            extension = file.name.lower().rsplit(".", 1)[-1]

            if extension not in ["png", "jpg", "jpeg"]:
                raise serializers.ValidationError(
                    "Bukti hanya boleh berupa PNG, JPG, atau JPEG."
                )

            if file.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Ukuran setiap file maksimal 5 MB."
                )

        return files

    def validate(self, attrs):
        if self.instance is None and not attrs.get("evidence"):
            raise serializers.ValidationError({
                "evidence": "Unggah minimal 1 file bukti."
            })

        return attrs

    def create(self, validated_data):
        files = validated_data.pop("evidence", [])
        sanggahan = Sanggahan.objects.create(**validated_data)

        for file in files:
            BuktiSanggahan.objects.create(
                sanggahan=sanggahan,
                file=file,
                nama_asli=file.name,
            )

        return sanggahan

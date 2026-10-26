
from django import forms
from .models import Appeal


MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}


class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleFileField(forms.FileField):
    widget = MultipleFileInput

    def clean(self, data, initial=None):
        if not data:
            if self.required:
                raise forms.ValidationError(
                    "Unggah minimal satu bukti."
                )
            return []

        files = data if isinstance(data, (list, tuple)) else [data]

        if not 1 <= len(files) <= 3:
            raise forms.ValidationError(
                "Unggah 1 sampai 3 file bukti."
            )

        cleaned_files = []
        for file in files:
            cleaned = super().clean(file, initial)

            if cleaned.size > MAX_FILE_SIZE:
                raise forms.ValidationError(
                    f"{cleaned.name} melebihi batas 5 MB."
                )

            extension = "." + cleaned.name.rsplit(".", 1)[-1].lower()
            if extension not in ALLOWED_EXTENSIONS:
                raise forms.ValidationError(
                    "Format bukti harus JPG, PNG, atau PDF."
                )

            # Pemeriksaan awal tipe konten; bukan pengganti
            # pemeriksaan keamanan file di server.
            content_type = getattr(cleaned, "content_type", "")
            expected_types = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".pdf": "application/pdf",
            }
            if content_type != expected_types[extension]:
                raise forms.ValidationError(
                    f"Tipe file {cleaned.name} tidak sesuai."
                )

            cleaned_files.append(cleaned)

        return cleaned_files


class AppealForm(forms.ModelForm):
    evidence = MultipleFileField(
        label="Bukti pendukung",
        widget=MultipleFileInput(
            attrs={
                "accept": ".jpg,.jpeg,.png,.pdf",
                "multiple": True,
            }
        )
    )

    consent = forms.BooleanField(
        required=True,
        label=(
            "Saya menyatakan kronologi dan bukti "
            "yang diberikan benar."
        )
    )

    class Meta:
        model = Appeal
        fields = ["reason", "story"]
        widgets = {
            "reason": forms.Select(),
            "story": forms.Textarea(attrs={
                "rows": 6,
                "minlength": 20,
                "maxlength": 3000,
                "placeholder": (
                    "Jelaskan kronologi dan alasan sanggahan..."
                ),
            }),
        }

    def clean_story(self):
        story = self.cleaned_data["story"].strip()

        if len(story) < 20:
            raise forms.ValidationError(
                "Kronologi harus minimal 20 karakter."
            )

        return story

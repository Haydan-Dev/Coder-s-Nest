import phonenumbers


def validate_phone_number(phone: str, region: str = "IN") -> str:
    """
    Converts any phone number to E.164 format and validates globally
    """

    try:
        parsed = phonenumbers.parse(phone, region)

        if not phonenumbers.is_valid_number(parsed):
            raise ValueError("Invalid phone number")

        return phonenumbers.format_number(
            parsed,
            phonenumbers.PhoneNumberFormat.E164
        )

    except Exception:
        raise ValueError("Invalid phone number format")
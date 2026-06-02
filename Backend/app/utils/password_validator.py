import re

PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])"      # lowercase
    r"(?=.*[A-Z])"       # uppercase
    r"(?=.*\d)"          # number
    r"(?=.*[^A-Za-z0-9])" # special char
    r".{8,}$"            # min length 8
)


def validate_password_strength(password: str) -> str:
    if not PASSWORD_REGEX.match(password):
        raise ValueError(
            "Password must be at least 8 chars and include uppercase, lowercase, number, special character."
        )
    return password


def passwords_match(password: str, confirm_password: str) -> None:
    if password != confirm_password:
        raise ValueError("Passwords do not match")
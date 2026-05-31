CATEGORY_KEYWORDS = {
    "Vivienda": ["rent", "landlord", "mortgage", "condo", "hoa", "housing"],
    "Comida": ["starbucks", "coffee", "restaurant", "uber eats", "supermarket", "grocery", "food"],
    "Transporte": ["uber", "lyft", "metro", "bus", "gas", "fuel", "toll", "parking"],
    "Servicios": ["internet", "water", "electric", "phone", "utility", "netflix", "spotify"],
    "Entretenimiento": ["cinema", "movie", "steam", "xbox", "playstation", "games", "concert"],
}


def normalize_description(description: str) -> str:
    cleaned = " ".join(description.lower().split())
    return "".join(ch for ch in cleaned if ch.isalnum() or ch.isspace())


def infer_category(description: str) -> str:
    cleaned = normalize_description(description)
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in cleaned for keyword in keywords):
            return category
    return "Otros"

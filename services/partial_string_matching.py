import difflib

def find_closest_match(names, query):
    matches = difflib.get_close_matches(query, names, n=1, cutoff=0)
    if matches:
        return matches[0]
    else:
        return []

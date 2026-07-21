class ID_not_valid(Exception):
    def __init__(self, msg):
        self._message = msg

    def getMessage(self):
        return self._message

    def __str__(self):
        return self._message

class Empty_name(Exception):
    def __init__(self, msg):
        self._message = msg

    def getMessage(self):
        return self._message

    def __str__(self):
        return self._message

class Grade_Outside_Of_Wanted_Interval(Exception):
    def __init__(self, msg):
        self._message = msg

    def getMessage(self):
        return self._message

    def __str__(self):
        return self._message
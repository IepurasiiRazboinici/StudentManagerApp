from src.domain.exceptions import *

class Student:

    def __init__(self, ids, name):
        """
        Create a Student entity
        :param ids: Student's unique ID
        :param name: Student's name
        """
        if not isinstance(ids, int) or ids <= 0:
            raise ID_not_valid("ID must be a positive integer.")
        if not isinstance(name, str) or not name.strip():
            raise Empty_name("Name must be a non-empty string.")
        self.__ids = ids
        self.__name = name.strip()

    def get_ids(self):
        return self.__ids

    def get_name(self):
        return self.__name

    def set_ids(self, new_id):
        self.__ids = new_id

    def set_name(self, new_name):
        self.__name = new_name

    def __eq__(self, other):
        if isinstance(other, Student):
            return (self.__ids, self.__name) == (other.__ids, other.__name)
        return False

    def __str__(self):
        return f'Student ID: {self.__ids}, Student Name: {self.__name}'
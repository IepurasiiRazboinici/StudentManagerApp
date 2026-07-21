from src.domain.exceptions import *

class Grade:

    def __init__(self, dis_id, stud_id, value):
        """
        Create a Student entity
        :param dis_id: Discipline's unique ID
        :param stud_id: Student's unique ID
        :param value: Student's grade
        """
        if not isinstance(dis_id, int) or dis_id <= 0:
            raise ID_not_valid("Discipline ID must be a positive integer.")
        if not isinstance(stud_id, int) or stud_id <= 0:
            raise ID_not_valid("Student ID must be a positive integer.")
        if not isinstance(value, int) or value < 1 or value > 10 :
            raise Grade_Outside_Of_Wanted_Interval("The grade must be between 1 and 10.")
        self.__dis_id = dis_id
        self.__stud_id = stud_id
        self.__value = value

    def get_dis_id(self):
        return self.__dis_id

    def get_stud_id(self):
        return self.__stud_id

    def get_value(self):
        return self.__value

    def __eq__(self, other):
        if isinstance(other, Grade):
            return (self.__dis_id, self.__stud_id, self.__value) == (other.__dis_id, other.__stud_id, other.__value)
        return False

    def __str__(self):
        return f'Student ID: {self.__stud_id}, Discipline ID: {self.__dis_id}, Value: {self.__value}'
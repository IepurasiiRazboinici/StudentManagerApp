from src.domain.Student import *
from src.domain.Grade import *
from src.domain.Discipline import *
from src.repository.Memory import *
from src.repository.TextFIle import *
from src.repository.BinaryFile import *
from src.domain.exceptions import *
from src.services.partial_string_matching import *
from src.services.undo_redo import *

class Student_Services:

    def __init__(self, studrepository: Repo, disrepository: Repo, grdrepository: Repo, undo_service):
        self.studrepository = studrepository
        self.disrepository = disrepository
        self.grdrepository = grdrepository
        self.undo_service = undo_service

    def add_student(self, ids, name):
        """
        Adds a student entity to the list. The program makes sure that the input is correct.
        :param ids: The id of the student
        :param name: The name of the student
        :return: True if the operation was successful, False otherwise
        """
        for student in self.studrepository.get_all():
            if student.get_ids() == ids:
                return False
        try:
            x = Student(ids, name)
            self.studrepository.add(x)

            functionRedo = FunctionCall(self.studrepository.add, x)
            functionUndo = FunctionCall(self.studrepository.remove, x)
            self.undo_service.recordUndo(Operation(functionUndo, functionRedo))

            return True
        except (ID_not_valid, Empty_name):
            return False

    def remove_student(self, ids):
        """
        Removes a student entity from the list. The program makes sure that the input is correct.
        :param ids: The id of the student
        :return: True if the operation was successful, False otherwise
        """
        if not isinstance(ids, int) or ids <= 0:
            return False
        id_found = False
        for student in self.studrepository.get_all():
            if student.get_ids() == ids:
                # when removing a student remove all his grades
                grades = [] # save his grades somewhere
                for grade in self.grdrepository.get_all():
                    if grade.get_stud_id() == ids:
                        grades.append(grade)
                        self.grdrepository.remove(grade)
                self.studrepository.remove(student)

                functionUndo = FunctionCall(self.studrepository.add, student)
                functionRedo = FunctionCall(self.studrepository.remove, student)
                operations = [Operation(functionUndo, functionRedo)]
                for grade in grades:
                    functionUndo = FunctionCall(self.grdrepository.add, grade)
                    functionRedo = FunctionCall(self.grdrepository.remove, grade)
                    operations.append(Operation(functionUndo, functionRedo))

                self.undo_service.recordUndo(CascadedOperation(*operations))

                id_found = True
                break
        if id_found:
            return True
        else:
            return False

    def update_student(self, ids, new_name):
        """
        Updates the name of the Student since the ID is unique and cannot be modified.
        :param ids: The id of the student
        :param new_name: The newest name of the student
        :return: True if the operation was successful, False otherwise
        """
        if not isinstance(ids, int) or ids <= 0:
            return False
        if not isinstance(new_name, str) or not new_name.strip():
            return False
        id_found = False
        for student in self.studrepository.get_all():
            if student.get_ids() == ids:
                old_name = student.get_name()
                self.studrepository.update(student, new_name)

                functionUndo = FunctionCall(self.studrepository.update, student, old_name)
                functionRedo = FunctionCall(self.studrepository.remove, student, new_name)
                self.undo_service.recordUndo(Operation(functionUndo, functionRedo))

                id_found = True
                break
        if id_found:
            return True
        else:
            return False

    def search_student_by_id(self, ids):
        """
        Searches the student entity by the given id.
        :param ids: The Student's unique id
        :return: The student if it was found, None otherwise
        """
        if not isinstance(ids, int) or ids <= 0:
            return None
        search = None
        for student in self.studrepository.get_all():
            if student.get_ids() == ids:
                search = student
                break
        return search

    def search_student_by_name(self, name):
        """
        Searches the student entity by the given name using the methods given
        :param name: The student's given name
        :return: the list of students that match the given name
        """
        students = []
        student_names = []
        for student in self.studrepository.get_all():
            student_names.append(student.get_name())
        name = find_closest_match(student_names, name)
        if name == []:
            return []
        for student in self.studrepository.get_all():
            if student.get_name() == name:
                students.append(student)
        return students

    def list_students(self):
        """
        Sends a list of all students.
        :return: The list of all students.
        """
        return self.studrepository.get_all()
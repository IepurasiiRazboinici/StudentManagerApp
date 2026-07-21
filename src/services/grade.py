from src.repository.Memory import *
from src.repository.TextFIle import *
from src.repository.BinaryFile import *
from src.domain.Student import *
from src.domain.Grade import *
from src.domain.Discipline import *
from src.domain.exceptions import *
from src.services.undo_redo import *

class Grade_Services:

    def __init__(self, studrepository: Repo, disrepository: Repo, grdrepository: Repo, undo_service):
        self.studrepository = studrepository
        self.disrepository = disrepository
        self.grdrepository = grdrepository
        self.undo_service = undo_service

    def add_grade(self, stud_id, dis_id, value):
        """
        Adds a grade for a given student at a given discipline
        :param stud_id: The Student's unique ID
        :param dis_id: The Discipline's unique ID
        :param value: The Grade value
        :return: True if the operation succeeded, false otherwise
        """
        student_found = False
        discipline_found = False
        for student in self.studrepository.get_all():
            if student.get_ids() == stud_id:
                student_found = True
        for discipline in self.disrepository.get_all():
            if discipline.get_ids() == dis_id:
                discipline_found = True
        if not student_found or not discipline_found:
            return False
        try:
            x = Grade(dis_id, stud_id, value)
            self.grdrepository.add(x)

            functionRedo = FunctionCall(self.grdrepository.add, x)
            functionUndo = FunctionCall(self.grdrepository.remove, x)
            self.undo_service.recordUndo(Operation(functionUndo, functionRedo))

            return True
        except (ID_not_valid, Grade_Outside_Of_Wanted_Interval):
            return False

    def list_grades(self):
        """
        Sends a list of all grades.
        :return: The list of all grades.
        """
        return self.grdrepository.get_all()

from src.domain.Student import *
from src.domain.Grade import *
from src.domain.Discipline import *
from src.repository.Memory import *
from src.repository.TextFIle import *
from src.repository.BinaryFile import *
from src.domain.exceptions import *
from src.services.partial_string_matching import *
from src.services.undo_redo import *

class Discipline_Services:

    def __init__(self, studrepository : Repo, disrepository : Repo, grdrepository : Repo, undo_service):
        self.studrepository = studrepository
        self.disrepository = disrepository
        self.grdrepository = grdrepository
        self.undo_service = undo_service

    def add_discipline(self, ids, name):
        """
        Adds a discipline entity to the list. The program makes sure that the input is correct.
        :param ids: The id of the discipline
        :param name: The name of the discipline
        :return: True if the operation was successful, False otherwise
        """
        for discipline in self.disrepository.get_all():
            if discipline.get_ids() == ids:
                return False
        try:
            x = Discipline(ids, name)
            self.disrepository.add(x)

            functionRedo = FunctionCall(self.disrepository.add, x)
            functionUndo = FunctionCall(self.disrepository.remove, x)
            self.undo_service.recordUndo(Operation(functionUndo, functionRedo))

            return True
        except (ID_not_valid, Empty_name):
            return False

    def remove_discipline(self, ids):
        """
        Removes a discipline entity from the list. The program makes sure that the input is correct.
        :param ids: The id of the discipline
        :return: True if the operation was successful, False otherwise
        """
        if not isinstance(ids, int) or ids <= 0:
            return False
        id_found = False
        for discipline in self.disrepository.get_all():
            if discipline.get_ids() == ids:
                # remove all the grades then the discipline
                grades = []  # save his grades somewhere
                for grade in self.grdrepository.get_all():
                    if grade.get_dis_id() == ids:
                        grades.append(grade)
                        self.grdrepository.remove(grade)
                self.disrepository.remove(discipline)

                functionUndo = FunctionCall(self.disrepository.add, discipline)
                functionRedo = FunctionCall(self.disrepository.remove, discipline)
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

    def update_discipline(self, ids, new_name):
        """
        Updates the name of the Discipline since the ID is unique and cannot be modified.
        :param ids: The id of the discipline
        :param new_name: The newest name of the discipline
        :return: True if the operation was successful, False otherwise
        """
        if not isinstance(ids, int) or ids <= 0:
            return False
        if not isinstance(new_name, str) or not new_name.strip():
            return False
        id_found = False
        for discipline in self.disrepository.get_all():
            if discipline.get_ids() == ids:
                old_name = discipline.get_name()
                self.disrepository.update(discipline, new_name)

                functionUndo = FunctionCall(self.disrepository.update, discipline, old_name)
                functionRedo = FunctionCall(self.disrepository.remove, discipline, new_name)
                self.undo_service.recordUndo(Operation(functionUndo, functionRedo))

                id_found = True
                break
        if id_found:
            return True
        else:
            return False

    def search_discipline_by_id(self, ids):
        """
        Searches the discipline entity by the given id.
        :param ids: The Discipline's unique id
        :return: The discipline if it was found, None otherwise
        """
        if not isinstance(ids, int) or ids <= 0:
            return None
        search = None
        for discipline in self.disrepository.get_all():
            if discipline.get_ids() == ids:
                search = discipline
                break
        return search

    def search_discipline_by_name(self, name):
        """
        Searches the discipline entity by the given name using the methods given
        :param name: The discipline's given name
        :return: the list of disciplines that match the given name
        """
        disciplines = []
        discipline_names = []
        for discipline in self.disrepository.get_all():
            discipline_names.append(discipline.get_name())
        name = find_closest_match(discipline_names, name)
        if name == []:
            return []
        for discipline in self.disrepository.get_all():
            if discipline.get_name() == name:
                disciplines.append(discipline)
        return disciplines

    def list_disciplines(self):
        """
        Sends a list of all disciplines.
        :return: The list of all disciplines.
        """
        return self.disrepository.get_all()
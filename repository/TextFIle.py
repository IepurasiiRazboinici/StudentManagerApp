from src.repository.repo import *
from src.domain.Student import *
from src.domain.Grade import *
from src.domain.Discipline import *
from copy import deepcopy

class TextFileRepository(Repo):
    def __init__(self, filename, types):
        self._filename = filename
        self._types = types

    def add(self, entity):
        with open(self._filename, 'a') as file:
            if self._types == Student:
                file.write(f"{entity.get_ids()},{entity.get_name()}\n")
            elif self._types == Discipline:
                file.write(f"{entity.get_ids()},{entity.get_name()}\n")
            else:
                file.write(f"{entity.get_stud_id()},{entity.get_dis_id()},{entity.get_value()}\n")

    def remove(self, entity):
        entities = self.get_all()
        entities = [e for e in entities if e != entity]
        self._write_all(entities)

    def update(self, entity, new):
        entities = deepcopy(self.get_all())
        if self._types == Student:
            for student in entities:
                if student == entity:
                    student.set_name(new)
                    self.clear()
                    self._write_all(entities)
        elif self._types == Discipline:
            for discipline in entities:
                if discipline == entity:
                    discipline.set_name(new)
                    self.clear()
                    self._write_all(entities)

    def get_all(self):
        entities = []
        try:
            with open(self._filename, 'r') as file:
                if self._types == Student:
                    for line in file:
                        ids, name = line.strip().split(',')
                        entities.append(Student(int(ids), name))
                elif self._types == Discipline:
                    for line in file:
                        ids, name = line.strip().split(',')
                        entities.append(Discipline(int(ids), name))
                else:
                    for line in file:
                        stud_id, dis_id, value = line.strip().split(',')
                        entities.append(Grade(int(stud_id), int(dis_id), int(value)))
        except FileNotFoundError:
            pass
        return entities

    def clear(self):
        with open(self._filename, 'w') as file:
            file.truncate()

    def _write_all(self, entities):
        with open(self._filename, 'w') as file:
            if self._types == Student:
                for entity in entities:
                    file.write(f"{entity.get_ids()},{entity.get_name()}\n")
            elif self._types == Discipline:
                for entity in entities:
                    file.write(f"{entity.get_ids()},{entity.get_name()}\n")
            else:
                for entity in entities:
                    file.write(f"{entity.get_dis_id()},{entity.get_stud_id()},{entity.get_value()}\n")

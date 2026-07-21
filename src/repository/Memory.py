from src.repository.repo import *
from src.domain.Student import *
from src.domain.Discipline import *

class MemoryRepository(Repo):
    def __init__(self, types):
        self._entities = []
        self._types = types

    def add(self, entity):
        self._entities.append(entity)

    def remove(self, entity):
        self._entities.remove(entity)

    def update(self, entity, new):
        if self._types == Student:
            for student in self._entities:
                if student == entity:
                    student.set_name(new)
        elif self._types == Discipline:
            for discipline in self._entities:
                if discipline == entity:
                    discipline.set_name(new)

    def get_all(self):
        return self._entities.copy()

    def clear(self):
        self._entities.clear()

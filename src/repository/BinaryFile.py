import pickle
from src.repository.repo import *
from src.domain.Student import *
from src.domain.Grade import *
from src.domain.Discipline import *
from copy import deepcopy

class BinaryFileRepository(Repo):
    def __init__(self, filename, types):
        self._filename = filename
        self._types = types

    def add(self, entity):
        entities = self.get_all()
        entities.append(entity)
        self._write_all(entities)

    def remove(self, entity):
        entities = self.get_all()
        entities = [s for s in entities if s != entity]
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
        try:
            with open(self._filename, 'rb') as file:
                return pickle.load(file)
        except (FileNotFoundError, EOFError):
            return []

    def clear(self):
        self._write_all([])

    def _write_all(self, entities):
        with open(self._filename, 'wb') as file:
            pickle.dump(entities, file)


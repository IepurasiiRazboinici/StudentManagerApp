from abc import ABC, abstractmethod

class Repo(ABC):
    @abstractmethod
    def add(self, entity):
        pass

    @abstractmethod
    def remove(self, entity):
        pass

    @abstractmethod
    def update(self, entity, new):
        pass

    @abstractmethod
    def get_all(self):
        pass

    @abstractmethod
    def clear(self):
        pass

# This class is used to create a pattern on which every other implementation class should use
# The main entity used by all repositories defined by this is Student, from Student_entity
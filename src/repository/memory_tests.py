import unittest
from src.repository.Memory import *

class tests(unittest.TestCase):

    def test_add(self):
        repo = MemoryRepository(Student)
        repo.clear()
        repo.add(Student(1,"Marius"))
        assert repo.get_all() == [Student(1,"Marius")]

    def test_remove(self):
        repo = MemoryRepository(Student)
        repo.clear()
        repo.add(Student(1,"Marius"))
        repo.remove(Student(1,"Marius"))
        assert repo.get_all() == []

    def test_update(self):
        repo = MemoryRepository(Student)
        repo.clear()
        repo.add(Student(1,"Marius"))
        repo.update(Student(1,"Marius"),"Mihai")
        assert repo.get_all() == [Student(1,"Mihai")]

if __name__ == '__main__':
    unittest.main()
import unittest
from src.repository.BinaryFile import *
import os

class tests(unittest.TestCase):

    def setUp(self):
        self.binary_file = "test_students.pickle"
        if os.path.exists(self.binary_file):
            os.remove(self.binary_file)

    def tearDown(self):
        if os.path.exists(self.binary_file):
            os.remove(self.binary_file)

    def test_add(self):
        repo = BinaryFileRepository(self.binary_file, Student)
        repo.clear()
        repo.add(Student(1, "Marius"))
        assert repo.get_all() == [Student(1, "Marius")]

    def test_remove(self):
        repo = BinaryFileRepository(self.binary_file, Student)
        repo.clear()
        repo.add(Student(1, "Marius"))
        repo.remove(Student(1, "Marius"))
        assert repo.get_all() == []

    def test_update(self):
        repo = BinaryFileRepository(self.binary_file, Student)
        repo.clear()
        repo.add(Student(1, "Marius"))
        repo.update(Student(1, "Marius"), "Mihai")
        assert repo.get_all() == [Student(1, "Mihai")]
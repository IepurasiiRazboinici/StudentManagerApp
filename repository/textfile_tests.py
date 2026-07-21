from src.repository.TextFIle import *
import unittest
import os

class tests(unittest.TestCase):
    
    def setUp(self):
        self.text_file = "test_students.txt"
        if os.path.exists(self.text_file):
            os.remove(self.text_file)

    def tearDown(self):
        if os.path.exists(self.text_file):
            os.remove(self.text_file)

    def test_add(self):
        repo = TextFileRepository(self.text_file,Student)
        repo.clear()
        repo.add(Student(1, "Marius"))
        assert repo.get_all() == [Student(1, "Marius")]

    def test_remove(self):
        repo = TextFileRepository(self.text_file,Student)
        repo.clear()
        repo.add(Student(1, "Marius"))
        repo.remove(Student(1, "Marius"))
        assert repo.get_all() == []

    def test_update(self):
        repo = TextFileRepository(self.text_file,Student)
        repo.clear()
        repo.add(Student(1, "Marius"))
        repo.update(Student(1, "Marius"), "Mihai")
        assert repo.get_all() == [Student(1, "Mihai")]

from src.services.student import *
from src.services.grade import *
from src.services.discipline import *
import unittest
from src.repository.Memory import MemoryRepository

class Tests(unittest.TestCase):

    def test_student_services(self):
        srepo = MemoryRepository(Student)
        drepo = MemoryRepository(Discipline)
        grepo = MemoryRepository(Grade)
        services = Student_Services(srepo,drepo,grepo)
        servicesg = Grade_Services(srepo,drepo,grepo)
        servicesd = Discipline_Services(srepo,drepo,grepo)

        # Adding a student
        services.add_student(1, "Mihai")
        services.add_student(2, "Mihai")
        assert srepo.get_all() == [Student(1, "Mihai"), Student(2, "Mihai")]

        # Removing a student ( removing also removes all his grades ) - here i need a discipline and grades for that
        servicesd.add_discipline(1,"Matematica")
        servicesg.add_grade(1,1,7)
        services.remove_student(1)
        assert srepo.get_all() == [Student(2,"Mihai")]
        assert grepo.get_all() == []

        # Updating a student
        services.update_student(2,"Marius")
        assert srepo.get_all() == [Student(2,"Marius")]

        # Searching by ID
        student = services.search_student_by_id(2)
        assert student == Student(2,"Marius")

        # Searching by Name
        student = services.search_student_by_name("ari")
        assert student == [Student(2,"Marius")]

        srepo.clear()
        drepo.clear()
        grepo.clear()

if __name__ == '__main__':
    unittest.main()

from src.services.student import *
from src.services.discipline import *
from src.services.grade import *
import unittest
from src.repository.Memory import MemoryRepository

class tests(unittest.TestCase):

    def test_grade_services(self):
        srepo = MemoryRepository(Student)
        drepo = MemoryRepository(Discipline)
        grepo = MemoryRepository(Grade)
        services = Student_Services(srepo, drepo, grepo)
        servicesg = Grade_Services(srepo, drepo, grepo)
        servicesd = Discipline_Services(srepo, drepo, grepo)

        # Adding a Grade
        services.add_student(1,"Marius")
        servicesd.add_discipline(1,"Info")
        servicesg.add_grade(1,1, 7)
        assert grepo.get_all() == [Grade(1,1,7)]

        srepo.clear()
        drepo.clear()
        grepo.clear()

if __name__ == '__main__':
    unittest.main()

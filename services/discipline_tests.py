from src.services.student import *
from src.services.grade import *
from src.services.discipline import *
import unittest
from src.repository.Memory import MemoryRepository

class Tests(unittest.TestCase):

    def test_discipline_services(self):
        srepo = MemoryRepository(Student)
        drepo = MemoryRepository(Discipline)
        grepo = MemoryRepository(Grade)
        services = Student_Services(srepo,drepo,grepo)
        servicesg = Grade_Services(srepo,drepo,grepo)
        servicesd = Discipline_Services(srepo,drepo,grepo)

        # Adding a Discipline
        servicesd.add_discipline(1, "Informatica")
        servicesd.add_discipline(2, "Matematica")
        assert drepo.get_all() == [Discipline(1, "Informatica"), Discipline(2, "Matematica")]

        # Removing a Discipline ( removing also removes all grades )
        services.add_student(1,"Marius")
        servicesg.add_grade(1,1,7)
        servicesd.remove_discipline(1)
        assert drepo.get_all() == [Discipline(2,"Matematica")]
        assert grepo.get_all() == []

        # Updating a discipline
        servicesd.update_discipline(2,"Romana")
        assert drepo.get_all() == [Discipline(2,"Romana")]

        # Searching by ID
        discipline = servicesd.search_discipline_by_id(2)
        assert discipline == Discipline(2,"Romana")

        # Searching by Name
        discipline = servicesd.search_discipline_by_name("ana")
        assert discipline == [Discipline(2,"Romana")]

        srepo.clear()
        drepo.clear()
        grepo.clear()

if __name__ == '__main__':
    unittest.main()

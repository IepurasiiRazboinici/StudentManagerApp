from src.repository.Memory import *
from src.repository.TextFIle import *
from src.repository.BinaryFile import *
from src.domain.Student import *
from src.domain.Discipline import *
from src.domain.Grade import *
from src.services.student import *
from src.services.discipline import *
from src.services.grade import *
from src.services.statistics import *
from src.ui.ui import *

def start():
    rstudents = None
    rdisciplines = None
    rgrades = None
    settings = {}
    try:
        with open("settings.properties", "r") as file:
            for line in file:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    settings[key.strip()] = value.strip()
    except FileNotFoundError:
        print("ERROR - settings.properties file not found.")
        return

    repository = settings.get("repository")
    file_stud = settings.get("students")
    file_dis = settings.get("disciplines")
    file_grd = settings.get("grades")

    if repository == "inmemory":
        rstudents = MemoryRepository(Student)
        rdisciplines = MemoryRepository(Discipline)
        rgrades = MemoryRepository(Grade)
    elif repository == "textfiles":
        if not file_stud:
            print("Filename for student must be specified for TextFileRepository.")
            return
        rstudents = TextFileRepository(file_stud,Student)
        if not file_dis:
            print("Filename for discipline must be specified for TextFileRepository.")
            return
        rdisciplines = TextFileRepository(file_dis,Discipline)
        if not file_grd:
            print("Filename for grade must be specified for TextFileRepository.")
            return
        rgrades = TextFileRepository(file_grd,Grade)
    elif repository == "binaryfiles":
        if not file_stud:
            print("Filename for student must be specified for TextFileRepository.")
            return
        rstudents = BinaryFileRepository(file_stud,Student)
        if not file_dis:
            print("Filename for discipline must be specified for TextFileRepository.")
            return
        rdisciplines = BinaryFileRepository(file_dis,Discipline)
        if not file_grd:
            print("Filename for grade must be specified for TextFileRepository.")
            return
        rgrades = BinaryFileRepository(file_grd,Grade)
    else:
        print("Invalid repository type")
        return

    undo_service = UndoService()
    dis_services = Discipline_Services(rstudents,rdisciplines,rgrades, undo_service)
    stud_services = Student_Services(rstudents, rdisciplines, rgrades, undo_service)
    grd_services = Grade_Services(rstudents, rdisciplines, rgrades, undo_service)
    stat_services = Statistics(rstudents, rdisciplines, rgrades)

    ui = UI(stud_services, dis_services, grd_services,stat_services, undo_service)
    ui.run()

if __name__ == "__main__":
    start()
from src.services.student import *
from src.services.discipline import *
from src.services.grade import *
from random import randint
from src.services.undo_redo import *

class UI:
    def __init__(self, student_service, discipline_service, grade_service, statistics_service, undo_service):
        self.student_service = student_service
        self.discipline_service = discipline_service
        self.grade_service = grade_service
        self.statistics_service = statistics_service
        self.undo_service = undo_service

    def generate_entities(self):
        i = 1
        names = ["Marius", "Mihai", "Cosmin", "Robert", "Dragos", "Denis", "Claudiu", "Joe", "John"]
        while i <= 20:
            ids = i
            name = names[randint(0, len(names) - 1)]
            if self.student_service.add_student(ids, name):
                i += 1
        i = 1
        curriculum = ["Informatics","Mathematics","Geography","English","History","Biology","Ethics"]
        while i <= 20:
            ids = i
            name = curriculum[randint(0, len(curriculum) - 1)]
            if self.discipline_service.add_discipline(ids, name):
                i += 1
        i = 1
        while i <= 20:
            idstud = randint(1,20)
            iddis = randint(1,20)
            grade = randint(1,10)
            if self.grade_service.add_grade(idstud, iddis, grade):
                i += 1

    def print_menu(self):
        print("\nMain Menu:")
        print("1. Manage Students")
        print("2. Manage Disciplines")
        print("3. Manage Grades")
        print("4. List ALL")
        print("5. See Statistics")
        print("6. Undo last operation")
        print("7. Redo last operation")
        print("8. Exit")

    def print_student_menu(self):
        print("\nStudents Menu:")
        print("1. Add Student")
        print("2. Remove Student")
        print("3. List Students")
        print("4. Search Students")
        print("5. Update Student")
        print("6. Back to Main Menu")

    def print_discipline_menu(self):
        print("\nDisciplines Menu:")
        print("1. Add Discipline")
        print("2. Remove Discipline")
        print("3. List Disciplines")
        print("4. Search Disciplines")
        print("5. Update Discipline")
        print("6. Back to Main Menu")

    def print_grade_menu(self):
        print("\nGrades Menu:")
        print("1. Add Grade")
        print("2. Back to Main Menu")

    def add_stud(self):
        studid = randint(21,1000)
        name = input("Enter Student Name: ")
        if name != "":
            if self.student_service.add_student(studid, name):
                print("\nStudent added successfully\n")
            else:
                print("\nStudent could not be added\n")
        else:
            print("\nStudent Name can't be empty\n")

    def remove_stud(self):
        ids = input("Enter Student ID: ")
        try:
            ids = int(ids)
            if self.student_service.remove_student(ids):
                print("\nStudent removed successfully\n")
            else:
                print("\nStudent could not be removed\n")
        except (ValueError, TypeError):
            print("\nStudent ID is invalid\n")

    def list_stud(self):
        all_students = self.student_service.list_students()
        for student in all_students:
            print(student)

    def search_stud(self):
        print("1. Search Student by ID")
        print("2. Search Student by Name")
        choice = input("Enter Choice: ")
        if choice == "1":
            ids = input("Enter Student ID: ")
            try:
                ids = int(ids)
                student = self.student_service.search_student_by_id(ids)
                if student == None:
                    print("\nStudent could not be found\n")
                else:
                    print(student)
            except (ValueError, TypeError):
                print("\nStudent ID is invalid\n")
        elif choice == "2":
            name = input("Enter Student Name: ")
            students = self.student_service.search_student_by_name(name)
            for student in students:
                print(f"Student: {student}")
        else:
            print("\nInvalid Choice\n")

    def update_stud(self):
        ids = input("Enter Student ID: ")
        new_name = input("Enter the new Name: ")
        try:
            ids = int(ids)
            if new_name!="":
                if self.student_service.update_student(ids,new_name):
                    print("\nStudent updated successfully\n")
                else:
                    print("\nStudent could not be updated\n")
            else:
                print("\nStudent Name can't be empty\n")
        except (ValueError, TypeError):
            print("\nStudent ID is invalid\n")

    def students_menu(self):
        while True:
            self.print_student_menu()
            schoice = input("Enter your choice: ")
            if schoice == "1":
                self.add_stud()
            elif schoice == "2":
                self.remove_stud()
            elif schoice == "3":
                self.list_stud()
            elif schoice == "4":
                self.search_stud()
            elif schoice == "5":
                self.update_stud()
            elif schoice == "6":
                break
            else:
                print("Invalid choice. Please try again.")

    def add_dis(self):
        disid = randint(21,1000)
        name = input("Enter Discipline Name: ")
        if name != "":
            if self.discipline_service.add_discipline(disid, name):
                print("\nDiscipline added successfully\n")
            else:
                print("\nDiscipline could not be added\n")
        else:
            print("\nDiscipline Name can't be empty\n")

    def remove_dis(self):
        ids = input("Enter Discipline ID: ")
        try:
            ids = int(ids)
            if self.discipline_service.remove_discipline(ids):
                print("\nDiscipline removed successfully\n")
            else:
                print("\nDiscipline could not be removed\n")
        except (ValueError, TypeError):
            print("\nDiscipline ID is invalid\n")

    def list_dis(self):
        all_disciplines = self.discipline_service.list_disciplines()
        for discipline in all_disciplines:
            print(discipline)

    def search_dis(self):
        print("1. Search Discipline by ID")
        print("2. Search Discipline by Name")
        choice = input("Enter Choice: ")
        if choice == "1":
            ids = input("Enter Discipline ID: ")
            try:
                ids = int(ids)
                discipline = self.discipline_service.search_discipline_by_id(ids)
                if discipline == None:
                    print("\nDiscipline could not be found\n")
                else:
                    print(discipline)
            except (ValueError, TypeError):
                print("\nDiscipline ID is invalid\n")
        elif choice == "2":
            name = input("Enter Discipline Name: ")
            disciplines = self.discipline_service.search_discipline_by_name(name)
            for discipline in disciplines:
                print(f"Discipline: {discipline}")
        else:
            print("\nInvalid Choice\n")

    def update_dis(self):
        ids = input("Enter Discipline ID: ")
        new_name = input("Enter the new Name: ")
        try:
            ids = int(ids)
            if new_name!="":
                if self.discipline_service.update_discipline(ids,new_name):
                    print("\nDiscipline updated successfully\n")
                else:
                    print("\nDiscipline could not be updated\n")
            else:
                print("\nDiscipline Name can't be empty\n")
        except (ValueError, TypeError):
            print("\nSDiscipline ID is invalid\n")

    def discipline_menu(self):
        while True:
            self.print_discipline_menu()
            dchoice = input("Enter your choice: ")
            if dchoice == "1":
                self.add_dis()
            if dchoice == "2":
                self.remove_dis()
            elif dchoice == "3":
                self.list_dis()
            elif dchoice == "4":
                self.search_dis()
            elif dchoice == "5":
                self.update_dis()
            elif dchoice == "6":
                break
            else:
                print("Invalid choice. Please try again.")

    def add_grd(self):
        student_id = input("Enter Student ID: ")
        discipline_id = input("Enter Discipline ID: ")
        value = input("Enter Grade: ")
        try:
            student_id = int(student_id)
            discipline_id = int(discipline_id)
            value = int(value)
            if self.grade_service.add_grade(student_id, discipline_id, value):
                print("\nGrade added successfully\n")
            else:
                print("\nGrade could not be added\n")
        except (ValueError, TypeError):
            print("\nInvalid Data\n")

    def grade_menu(self):
        while True:
            self.print_grade_menu()
            gchoice = input("Enter your choice: ")
            if gchoice == "1":
                self.add_grd()
            elif gchoice == "2":
                break
            else:
                print("Invalid choice. Please try again.")

    def print_statistics_menu(self):
        print("\nStatistics Menu:")
        print("1. See Failing students")
        print("2. School situation")
        print("3. Discipline situation")
        print("4. Back to Main Menu")

    def list_failing_students(self):
        list_of_failing_students = self.statistics_service.failing_students()
        for failing_student in list_of_failing_students:
            ids = failing_student[0]
            idd = failing_student[1]
            student = self.student_service.search_student_by_id(ids)
            discipline = self.discipline_service.search_discipline_by_id(idd)
            print(f"Student (id={ids}) {student.get_name()} is failing at {discipline.get_name()} (id={idd})")
        if list_of_failing_students == []:
            print("None of the students are failing a class!")

    def school_situation(self):
        list_of_ordered_students = self.statistics_service.ordered_students()
        for ordered_student in list_of_ordered_students:
            ids = ordered_student[0]
            medie = ordered_student[1]
            student = self.student_service.search_student_by_id(ids)
            print(f"Student (id={ids}) {student.get_name()} - with grade {medie}")
        if list_of_ordered_students == []:
            print("The school hasn't got any students yet!")

    def discipline_situation(self):
        list_of_ordered_disciplines = self.statistics_service.ordered_disciplines()
        for ordered_discipline in list_of_ordered_disciplines:
            idd = ordered_discipline[0]
            medie = ordered_discipline[1]
            discipline = self.discipline_service.search_discipline_by_id(idd)
            print(f"Discipline (id={idd}) {discipline.get_name()} - with grade {medie}")
        if list_of_ordered_disciplines == []:
            print("The discipline hasn't got any students yet!")

    def statistics(self):
        while True:
            self.print_statistics_menu()
            statichoice = input("Enter your choice: ")
            if statichoice == "1":
                self.list_failing_students()
            elif statichoice == "2":
                self.school_situation()
            elif statichoice == "3":
                self.discipline_situation()
            elif statichoice == "4":
                break
            else:
                print("Invalid choice. Please try again.")

    def run(self):
        stud = self.student_service.list_students()
        disc = self.discipline_service.list_disciplines()
        grad = self.grade_service.list_grades()
        if stud == [] and disc == [] and grad == []:
            self.generate_entities()
        while True:
            self.print_menu()
            choice = input("Enter your choice: ")
            if choice == "1":
                self.students_menu()
            elif choice == "2":
                self.discipline_menu()
            elif choice == "3":
                self.grade_menu()
            elif choice == "4":
                print("Students:")
                lista = self.student_service.list_students()
                for student in lista:
                    print(student)
                print("Disciplines:")
                lista = self.discipline_service.list_disciplines()
                for discipline in lista:
                    print(discipline)
                print("Grades:")
                lista = self.grade_service.list_grades()
                for grade in lista:
                    print(grade)
            elif choice == "5":
                self.statistics()
            elif choice == "6":
                try:
                    self.undo_service.undo()
                    print("Last operation undo(ed) succesfully! ( if possible )")
                except UndoError:
                    print("You can't undo an operation yet!")
            elif choice == "7":
                try:
                    self.undo_service.redo()
                    print("Last operation redo(ed) succesfully! ( if possible )")
                except UndoError:
                    print("You can't redo an operation yet!")
            elif choice == "8":
                break
            else:
                print("Invalid choice. Please try again.")
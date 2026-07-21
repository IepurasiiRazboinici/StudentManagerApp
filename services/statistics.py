from src.repository.repo import Repo
import copy

class Statistics:

    def __init__(self, studrepository: Repo, disrepository: Repo, grdrepository: Repo):
        self.studrepository = studrepository
        self.disrepository = disrepository
        self.grdrepository = grdrepository

    def failing_students(self):
        failing_students = []
        list3 = copy.deepcopy(self.grdrepository.get_all())
        for i in range(len(list3)):
            for j in range(i+1,len(list3)):
                if list3[i].get_stud_id() > list3[j].get_stud_id():
                    list3[i],list3[j] = list3[j],list3[i]
                elif list3[i].get_stud_id() == list3[j].get_stud_id():
                    if list3[i].get_dis_id() > list3[j].get_dis_id():
                        list3[i],list3[j] = list3[j],list3[i]
        i = 0
        while i < len(list3):
            ma,nr = 0,0
            current_stud,current_dis = list3[i].get_stud_id(), list3[i].get_dis_id()
            while i<len(list3) and list3[i].get_stud_id() == current_stud and list3[i].get_dis_id() == current_dis:
                ma += list3[i].get_value()
                nr += 1
                i += 1
            ma = ma / nr
            if ma < 5:
                failing_students.append([current_stud,current_dis])

        return failing_students

    def ordered_students(self):
        ordered_students = []
        per_discipline = []
        list3 = copy.deepcopy(self.grdrepository.get_all())
        for i in range(len(list3)):
            for j in range(i + 1, len(list3)):
                if list3[i].get_stud_id() > list3[j].get_stud_id():
                    list3[i], list3[j] = list3[j], list3[i]
                elif list3[i].get_stud_id() == list3[j].get_stud_id():
                    if list3[i].get_dis_id() > list3[j].get_dis_id():
                        list3[i], list3[j] = list3[j], list3[i]
        i = 0
        while i < len(list3):
            ma, nr = 0, 0
            current_stud, current_dis = list3[i].get_stud_id(), list3[i].get_dis_id()
            while i<len(list3) and list3[i].get_stud_id() == current_stud and list3[i].get_dis_id() == current_dis:
                ma += list3[i].get_value()
                nr += 1
                i += 1
            ma = ma / nr
            per_discipline.append([current_stud,current_dis,ma])

        i = 0
        while i < len(per_discipline):
            ma, nr = 0, 0
            current_stud = per_discipline[i][0]
            while i<len(per_discipline) and per_discipline[i][0] == current_stud:
                ma += per_discipline[i][2]
                nr += 1
                i += 1
            ma = ma / nr
            ordered_students.append([current_stud,ma])

        for i in range(len(ordered_students)):
            for j in range(i+1, len(ordered_students)):
                if ordered_students[i][1] < ordered_students[j][1]:
                    ordered_students[i],ordered_students[j] = ordered_students[j],ordered_students[i]
                elif ordered_students[i][1] == ordered_students[j][1]:
                    if ordered_students[i][0] > ordered_students[j][0]:
                        ordered_students[i],ordered_students[j] = ordered_students[j],ordered_students[i]

        return ordered_students

    def ordered_disciplines(self):
        ordered_disciplines = []
        per_discipline = []
        list3 = copy.deepcopy(self.grdrepository.get_all())
        for i in range(len(list3)):
            for j in range(i + 1, len(list3)):
                if list3[i].get_stud_id() > list3[j].get_stud_id():
                    list3[i], list3[j] = list3[j], list3[i]
                elif list3[i].get_stud_id() == list3[j].get_stud_id():
                    if list3[i].get_dis_id() > list3[j].get_dis_id():
                        list3[i], list3[j] = list3[j], list3[i]
        i = 0
        while i < len(list3):
            ma, nr = 0, 0
            current_stud, current_dis = list3[i].get_stud_id(), list3[i].get_dis_id()
            while i<len(list3) and list3[i].get_stud_id() == current_stud and list3[i].get_dis_id() == current_dis:
                ma += list3[i].get_value()
                nr += 1
                i += 1
            ma = ma / nr
            per_discipline.append([current_stud, current_dis, ma])

        i = 0
        while i < len(per_discipline):
            ma, nr = 0, 0
            current_dis = per_discipline[i][1]
            while i<len(per_discipline) and per_discipline[i][1] == current_dis:
                ma += per_discipline[i][2]
                nr += 1
                i += 1
            ma = ma / nr
            ordered_disciplines.append([current_dis, ma])

        for i in range(len(ordered_disciplines)):
            for j in range(i+1, len(ordered_disciplines)):
                if ordered_disciplines[i][1] < ordered_disciplines[j][1]:
                    ordered_disciplines[i],ordered_disciplines[j] = ordered_disciplines[j],ordered_disciplines[i]
                elif ordered_disciplines[i][1] == ordered_disciplines[j][1]:
                    if ordered_disciplines[i][0] > ordered_disciplines[j][0]:
                        ordered_disciplines[i],ordered_disciplines[j] = ordered_disciplines[j],ordered_disciplines[i]

        return ordered_disciplines
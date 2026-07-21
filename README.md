# 🎓 Student Management System

A robust command-line application built in Python for managing students, disciplines, and grades. This project was developed to demonstrate advanced Object-Oriented Programming (OOP) concepts, software design patterns, and clean architecture principles.

## 🚀 Key Features

* **Comprehensive CRUD Operations:** Manage entities (Students, Disciplines, Grades) with full Create, Read, Update, and Delete capabilities.
* **Layered Architecture:** The codebase is strictly separated into Domain, Repository, Services, and UI layers, ensuring high cohesion and low coupling.
* **Multiple Persistence Strategies:** Includes support for storing data in-memory, in text files, or via binary files (Pickle), easily configurable through a `settings.properties` file.
* **Advanced Undo/Redo System:** Implemented using the **Command Design Pattern** to support cascading operations (e.g., undoing the removal of a student also restores all their associated grades).
* **Smart Search:** Utilizes `difflib` for partial string matching, allowing intuitive search functionality by name.
* **Statistical Analysis:** Generates complex reports, including lists of failing students, overall school rankings, and discipline averages.
* **Automated Testing:** Business logic and repository layers are validated using Python's `unittest` framework.

## 🛠️ Tech Stack & Concepts

* **Language:** Python 3
* **Architecture:** Layered Architecture, Dependency Injection
* **Design Patterns:** Command Pattern (Undo/Redo)
* **Testing:** `unittest`
* **Data Serialization:** Pickle, Text I/O

## 🧠 What I Learned

Building this project significantly improved my understanding of software engineering fundamentals:
* **Clean Code:** Moving away from monolithic scripts to a modular, layered approach.
* **Design Patterns:** Seeing the practical value of the Command Pattern when implementing the complex cascading Undo/Redo logic.
* **Testing:** Writing unit tests to ensure that business rules and edge cases are handled correctly before integrating them into the UI.
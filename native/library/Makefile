CXX=x86_64-w64-mingw32-g++

OUT=bin/
SRC=src/

OBJ=bin/obj/

FLAGS=-Wall

output: main.o
	$(CXX) $(FLAGS) -shared -o $(OUT)gdext.dll $(OBJ)main.o

main.o: $(SRC)main.cpp
	$(CXX) $(FLAGS) -c -o $(OBJ)main.o $(SRC)main.cpp
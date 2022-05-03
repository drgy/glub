cmake_minimum_required(VERSION 3.15)

project(#[[name]] VERSION #[[version]] DESCRIPTION "#[[description]]" LANGUAGES CXX)

#[[submodules]]
#[[definitions]]

if(UNIX)
	add_compile_definitions(UNIX)
elseif(WIN32)
	add_compile_definitions(WINDOWS)
else()
	message(FATAL_ERROR "Detected platform is not supported!")
endif()

#[[setup]]

if(EXISTS ${PROJECT_SOURCE_DIR}/#[[resPath]])
	message(STATUS "Copying resources...")
	file(COPY ${PROJECT_SOURCE_DIR}/#[[resPath]] DESTINATION ${CMAKE_BINARY_DIR}/#[[resPath]])
endif()

message(STATUS "Setting up build options...")
file(GLOB_RECURSE SRC_FILES "./#[[srcPath]]*.h" "./#[[srcPath]]*.cpp")
#[[exec]]

#[[compile_options]]

message(STATUS "Linking...")
find_package(OpenGL REQUIRED)
target_link_libraries(#[[name]] ${OPENGL_LIBRARIES})
#[[linkLibs]]

if(UNIX)
	target_link_libraries(#[[name]] X11)
endif()

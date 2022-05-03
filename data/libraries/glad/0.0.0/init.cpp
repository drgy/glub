
	std::cout << "Initializing GLAD..." << std::flush;

	#ifdef LIB_GLFW
		auto gladAddress = glfwGetProcAddress;
	#endif

	#ifdef LIB_SDL
		auto gladAddress = SDL_GL_GetProcAddress;
	#endif

	if (!gladLoadGLLoader((GLADloadproc) gladAddress)) {
		std::cout << "FAILED" << std::endl;
		return 1;
	}

	std::cout << "OK" << std::endl;

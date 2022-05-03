
	std::cout << "Initializing Imgui..." << std::flush;

	IMGUI_CHECKVERSION();
	ImGui::CreateContext();
	ImGuiIO& io = ImGui::GetIO();
	(void) io;
	ImGui::StyleColorsDark();

	#ifdef LIB_GLFW
		ImGui_ImplGlfw_InitForOpenGL(window.getWindow(), true);
	#endif

	#ifdef LIB_SDL
		ImGui_ImplSDL2_InitForOpenGL(window.getWindow(), window.getContext());
	#endif

	ImGui_ImplOpenGL3_Init("#version 330");
	bool demoWindow = true;

	std::cout << "OK" << std::endl;

		ImGui_ImplOpenGL3_NewFrame();

		#ifdef LIB_GLFW
			ImGui_ImplGlfw_NewFrame();
		#endif

		#ifdef LIB_SDL
			ImGui_ImplSDL2_NewFrame(window.getWindow());
		#endif

		ImGui::NewFrame();
		ImGui::ShowDemoWindow(&demoWindow);
		ImGui::Render();
		ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());

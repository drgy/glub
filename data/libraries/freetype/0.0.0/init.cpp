
	std::cout << "Initializing Freetype..." << std::flush;

	FT_Library ft;

	if (FT_Init_FreeType(&ft)) {
		std::cout << "FAILED" << std::endl;
		return 1;
	}

	std::cout << "OK" << std::endl;

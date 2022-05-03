
	std::cout << "Initializing stb..." << std::flush;

	int width = 100;
	int height = 100;
	int channels = 3;
	int index = 0;
	uint8_t * pixels = new uint8_t[width * height * channels];

	for (int i = 0; i < height; i++) {
		for (int j = 0; j < width; j++) {
			pixels[index++] = int(255.99 * ((float)j / (float)width));
			pixels[index++] = int(255.99 * ((float)i / (float)height));
			pixels[index++] = int(255.99 * 0.5);
		}
	}

	stbi_write_png("stb_test.png", width, height, channels, pixels, width * channels);

	unsigned char * img = stbi_load("stb_test.png", &width, &height, &channels, 0);

	if (img == nullptr) {
		std::cout << "Failed" << std::endl;
		return 1;
	}

	std::cout << "OK" << std::endl;
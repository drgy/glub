#pragma once

#ifdef UNIX
	#include <SDL2/SDL.h>
#elif WINDOWS
	#include <SDL.h>
	#undef main
#endif

class CWindow {
public:
	CWindow() {

	}

	~CWindow() {
		destroyWindow();
	}

	bool create(unsigned int width, unsigned int height, const char * title) {
		destroyWindow();

    window = SDL_CreateWindow(title, 0, 0, width, height, SDL_WINDOW_OPENGL);

    if (!window) {
      return false;
    }

    context = SDL_GL_CreateContext(window);
    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
    SDL_SetRenderDrawColor(renderer, 25, 25, 25, 255);

    return true;
	}

	void start(std::function<void()> onUpdate) {
		while (!shouldClose) {
      SDL_Event Event;

      while (SDL_PollEvent(&Event)) {
        if (Event.type == SDL_QUIT) {
          shouldClose = true;
        }
      }

      onUpdate();

      SDL_RenderClear(renderer);
      SDL_RenderPresent(renderer);
      SDL_GL_SwapWindow(window);
    }
  }

	void destroyWindow() {
		if (context) {
      SDL_GL_DeleteContext(context);
    }

    if (renderer) {
      SDL_DestroyRenderer(renderer);
    }

    if (window) {
      SDL_DestroyWindow(window);
    }
	}

	void close() {
		shouldClose = true;
	}

	SDL_Window * getWindow() const {
		return window;
	}

private:
	SDL_Window * window = nullptr;
	void * context = nullptr;
  SDL_Renderer * renderer = nullptr;
	bool shouldClose = false;
};

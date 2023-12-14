const PROMPT_PLACEHOLDER = "An astronaut riding a horse";

export default function Home() {
	return (
		<main class="grid place-content-center py-8 gap-4">
			<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold">
				Imagine with Cloudflare Workers AI
			</h1>
			<div>
				<form action="/imagine" method="POST">
					<div class="col-span-full">
						<label
							for="prompt"
							class="block text-sm font-medium leading-6 text-gray-900"
						>
							Prompt
						</label>
						<div class="mt-2">
							<textarea
								id="prompt"
								name="prompt"
								rows={3}
								placeholder={PROMPT_PLACEHOLDER}
								class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
							>
								{PROMPT_PLACEHOLDER}
							</textarea>
						</div>
						<p class="mt-3 text-sm leading-6 text-gray-600">
							Model: Stable Diffusion XL Base 1.0
						</p>
					</div>

					<div class="mt-6 flex items-center">
						<button
							type="submit"
							class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-full"
						>
							Imagine
						</button>
					</div>
				</form>
			</div>
		</main>
	);
}

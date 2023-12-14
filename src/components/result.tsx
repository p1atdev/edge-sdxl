interface Props {
	prompt: string;
	imageSrc: string;
}

export default function Result({ prompt, imageSrc }: Props) {
	return (
		<main class="mx-4 my-2 md:mx-24 lg:mx-48 grid gap-4">
			<a href="/">
				<p class="underline">Back to home</p>
			</a>
			<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold">
				Generation result
			</h1>
			<p>Prompt: {prompt}</p>
			<img src={imageSrc} alt={prompt} />
		</main>
	);
}
